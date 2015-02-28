/*!
 * LetsBlog
 * Routes of user management pages (2015-02-19T12:14:53+0800)
 * Released under MIT license
 */

'use strict';

var async = require('async'),
	util = require('../../lib/util'),
	userGroupBLL = require('../../bll/usergroup'),
	userModel = require('../../entity/user'),
	userBLL = require('../../bll/user');


// 基本权限检查
function addPermissionChecking(handler, level) {
	return function(req, res, next) {
		if (req.currentUser.group.perm_manage_user >= level) {
			handler.apply(this, arguments);
		} else {
			next( util.createError('权限不足', 403) );
		}
	};
}


exports.create = addPermissionChecking(function(req, res, next) {
	userGroupBLL.list(function(err, result) {
		if (!err) {
			res.routeHandler.setData('user', userModel.createEntity());
			// 过滤出权限<=当前用户所在用户组的用户组
			res.routeHandler.setData('userGroupList', result.filter(function(group) {
				return req.currentUser.group.compare(group) >= 0;
			}));
		}
		next(err);
	});
}, 1);

exports.create_post = addPermissionChecking(function(req, res, next) {
	var user = req.getEntity('user', 'create');
	// 生成注册日期、最后活动时间
	user.regtime = user.lastactivity = new Date();
	// 获取当前IP
	user.lastip = req.ip;

	userBLL.create(user, req.currentUser, function(err) {
		if (err) {
			next(err);
		} else {
			res.routeHandler.renderInfo(res, {
				message: '已创建新用户 ' + user.nickname
			});
		}
	});
}, 1);


// 渲染更新用户页面
function renderUpdateForm(userid, res, next) {
	async.parallel([function(callback) {
		userBLL.readByUserId(userid, function(err, result) {
			if (!err) {
				if (result) {
					res.routeHandler.setData('user', result);
				} else {
					err = util.createError('用户不存在', 404);	
				}
			}
			callback(err);
		});
	}, function(callback) {
		userGroupBLL.list(function(err, result) {
			res.routeHandler.setData('userGroupList', result);
			callback(err);
		});
	}], next);
}

// 更新个人资料时，isMyProfile传true
function submitUpdateForm(userid, isMyProfile, req, res, next) {
	var newUser;
	async.waterfall([function(callback) {
		userBLL.readByUserId(userid, function(err, result) {
			if (!err && !result) {
				err = util.createError('用户不存在', 404);
			}
			callback(err, result);
		});
	}, function(user, callback) {
		newUser = req.getEntity('user', 'update');
		newUser.username = user.username;
		// 更新个人资料时，保持原有用户组
		if (isMyProfile) { newUser.groupid = req.currentUser.groupid; }
		// 更新个人资料时，无需检查当前用户的权限，第三个参数传null
		userBLL.update(newUser, userid, isMyProfile ? null : req.currentUser, callback);
	}], function(err) {
		if (err) {
			next(err);
		} else {
			res.routeHandler.renderInfo(res, {
				message: '已更新用户 ' + newUser.nickname
			});
		}
	});
}

exports.updateMyProfile = function(req, res, next) {
	res.routeHandler.setData('isMyProfile', true);
	renderUpdateForm(req.currentUser.userid, res, next);
};

exports.updateMyProfile_post = function(req, res, next) {
	submitUpdateForm(req.currentUser.userid, true, req, res, next);
};

exports.update = addPermissionChecking(function(req, res, next) {
	renderUpdateForm(parseInt(req.params.userid), res, next);
}, 2);

exports.update_post = addPermissionChecking(function(req, res, next) {
	submitUpdateForm(parseInt(req.params.userid), false, req, res, next);
}, 2);


exports.updateMyPassword_post = function(req, res, next) {
	var newPassword = req.body.newpassword;
	userBLL.updatePassword(
		newPassword, req.body.oldpassword, req.currentUser.username,
		function(err, result) {
			if (err) {
				next(err);
			} else {
				// 更新cookie中的密码
				res.cookie('password', result.newPassword, {
					path: '/',
					expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
					httpOnly: true
				});

				res.routeHandler.renderInfo(res, {
					message: '密码已修改'
				});
			}
		}
	);
};

exports.updatePassword = addPermissionChecking(function(req, res, next) {
	res.routeHandler.setData('username', req.params.username);
	next();
}, 2);

exports.updatePassword_post = addPermissionChecking(function(req, res, next) {
	userBLL.updatePassword(
		req.body.newpassword, null, req.body.username,
		function(err) {
			if (err) {
				next(err);
			} else {
				res.routeHandler.renderInfo(res, {
					message: '密码已修改'
				});
			}
		}
	);
}, 2);


exports.delete_post = addPermissionChecking(function(req, res, next) {
	var userids = util.convert(req.body.userids, 'array<int>');
	userBLL.delete(userids, function(err) {
		if (err) {
			next(err);
		} else {
			res.routeHandler.renderInfo(res, {
				message: '已删除指定用户'
			});
		}
	});
}, 2);


exports.list = addPermissionChecking(function(req, res, next) {
	var page = parseInt(req.query.page) || 1,
		params = {
			name: req.query.name || '',
			groupid: parseInt(req.query.groupid) || 0
		};

	async.parallel([function(callback) {
		userBLL.list(params, 15, page, function(err, result) {
			if (!err) {
				result.data.forEach(function(d) {
					d.regtime_formatted = util.formatDate(d.regtime, 'yyyy-MM-dd HH:mm:ss');
					d.lastactivity_formatted = util.formatDate(d.lastactivity, 'yyyy-MM-dd HH:mm:ss');
				});
				res.routeHandler.setData('userList', result.data);

				var hrefTpl = util.toQueryString(params);
				if (hrefTpl) {
					hrefTpl = '?' + hrefTpl + '&amp;';
				} else {
					hrefTpl = '?';
				}
				hrefTpl += 'page={{page}}';

				res.routeHandler.setData('params', params);
				if (result.totalPages > 1) {
					res.routeHandler.setData('paginator', util.createPaginatorData(
						result.page, result.totalPages, hrefTpl
					));
				}
			}
			callback(err);
		});
	}, function(callback) {
		userGroupBLL.list(function(err, result) {
			if (!err) {
				res.routeHandler.setData('userGroupList', result);
			}
			callback(err);
		});
	}], next);
}, 2);