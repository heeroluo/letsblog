/*!
 * LetsBlog
 * Routes of user management pages
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const pageType = require('../../page-type');
const userGroupBLL = require('../../../bll/usergroup');
const userModel = require('../../../entity/user');
const userBLL = require('../../../bll/user');


// 创建权限验证函数
function createPermissionChecking(limit) {
	return (req) => {
		if (req.currentUser.group.perm_manage_user < limit) {
			return util.createError('权限不足', 403);
		}
	};
}


// 创建用户界面
exports.create = {
	template: 'admin/user__form/user__form',
	callbacks: pageType.admin(
		pageType.prepend(
			createPermissionChecking(1),
			(req, res) => {
				res.routeHelper.viewData('user', userModel.createEntity());

				return userGroupBLL.list().then((result) => {
					// 过滤出权限<=当前用户所在用户组的用户组
					res.routeHelper.viewData(
						'userGroupList',
						result.filter((group) => {
							return req.currentUser.group.compare(group) >= 0;
						})
					);
				});
			}
		)
	)
};

// 提交新用户
exports['create/post'] = {
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			createPermissionChecking(1),
			(req, res) => {
				const user = req.getEntity('user', 'create');
				// 生成注册日期、最后活动时间
				user.regtime = user.lastactivity = new Date();
				// 获取当前IP
				user.lastip = req.ip;

				return userBLL.create(user, req.currentUser).then(() => {
					res.routeHelper.renderInfo(res, {
						message: '已创建新用户 ' + user.nickname
					});
				});
			}
		)
	)
};


// 渲染更新用户界面
function renderUpdateForm(userid, res) {
	return Promise.all([
		userBLL.readByUserId(userid).then((result) => {
			if (result) {
				res.routeHelper.viewData('user', result);
			} else {
				return util.createError('用户不存在', 404);
			}
		}),

		userGroupBLL.list().then((result) => {
			res.routeHelper.viewData('userGroupList', result);
		})
	]);
}

// 更新个人资料时，isMyProfile传true
function submitUpdateForm(userid, isMyProfile, req, res) {
	return userBLL.readByUserId(userid).then((result) => {
		if (!result) { return util.createError('用户不存在', 404); }
		return result;
	}).then((user) => {
		const newUser = req.getEntity('user', 'update');
		newUser.username = user.username;
		// 更新个人资料时，保持原有用户组
		if (isMyProfile) { newUser.groupid = req.currentUser.groupid; }
		// 更新个人资料时，无需检查当前用户的权限，第三个参数传null
		return userBLL.update(
			newUser, userid, isMyProfile ? null : req.currentUser
		).then(() => {
			return newUser;
		});
	}).then((newUser) => {
		res.routeHelper.renderInfo(res, {
			message: '已更新用户 ' + newUser.nickname
		});
	});
}

// 修改个人资料界面
exports['i/update'] = {
	template: 'admin/user__form/user__form',
	callbacks: pageType.admin(
		(req, res) => {
			res.routeHelper.viewData('isMyProfile', true);
			return renderUpdateForm(req.currentUser.userid, res);
		}
	)
};

// 提交个人资料修改
exports['i/update/post'] = {
	verb: 'post',
	callbacks: pageType.admin(
		(req, res) => {
			return submitUpdateForm(req.currentUser.userid, true, req, res);
		}
	)
};

// 修改用户资料界面
exports.update = {
	pathPattern: '/user/update/:userid',
	template: 'admin/user__form/user__form',
	callbacks: pageType.admin(
		pageType.prepend(
			createPermissionChecking(2),
			(req, res, next) => {
				return renderUpdateForm(parseInt(req.params.userid), res, next);
			}
		)
	)
};

// 提交用户资料修改
exports['update/post'] = {
	pathPattern: '/user/update/:userid/post',
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			createPermissionChecking(2),
			(req, res) => {
				return submitUpdateForm(parseInt(req.params.userid), false, req, res);
			}
		)
	)
};


// 修改个人密码
exports['i/update/password'] = pageType.admin();

// 提交个人密码修改
exports['i/update/password/post'] = {
	verb: 'post',
	callbacks: pageType.admin((req, res) => {
		const newPassword = req.body.newpassword;
		return userBLL.updatePassword(
			newPassword, req.body.oldpassword, req.currentUser.username
		).then((result) => {
			// 更新cookie中的密码
			res.cookie('password', result.newPassword, {
				path: '/',
				expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
				httpOnly: true
			});

			res.routeHelper.renderInfo(res, {
				message: '密码已修改'
			});
		});
	})
};

// 修改用户密码
exports['update/password'] = {
	pathPattern: '/user/update/password/:username',
	callbacks: pageType.admin(
		pageType.prepend(
			createPermissionChecking(2),
			(req, res) => {
				res.routeHelper.viewData('username', req.params.username);
			}
		)
	)
};

// 提交用户密码修改
exports['update/password/post'] = {
	pathPattern: '/user/update/password/:username/post',
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			createPermissionChecking(2),
			(req, res) => {
				return userBLL.updatePassword(
					req.body.newpassword, null, req.body.username
				).then(() => {
					res.routeHelper.renderInfo(res, {
						message: '密码已修改'
					});
				});
			}
		)
	)
};


// 用户列表
exports.list = pageType.admin(
	pageType.prepend(
		createPermissionChecking(2),
		(req, res) => {
			const page = parseInt(req.query.page) || 1;
			const params = {
				name: req.query.name || '',
				groupid: parseInt(req.query.groupid) || 0
			};

			return Promise.all([
				userBLL.list(params, 15, page).then((result) => {
					res.routeHelper.viewData({
						userList: result,
						params: params
					});
				}),

				userGroupBLL.list().then((result) => {
					res.routeHelper.viewData('userGroupList', result);
				})
			]);
		}
	)
);


// 批量删除用户
exports['list/batch'] = {
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			createPermissionChecking(2),
			(req, res) => {
				const userids = util.convert(req.body.userids, 'array<int>');
				return userBLL.delete(userids).then(() => {
					res.routeHelper.renderInfo(res, {
						message: '已删除指定用户'
					});
				});
			}
		)
	)
};