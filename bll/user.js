/*!
 * LetsBlog
 * Data access layer of user (2015-02-09T16:28:57+0800)
 * Released under MIT license
 */

'use strict';

var crypto =  require('crypto'),
	async = require('async'),
	util = require('../lib/util'),
	validator = require('../lib/validator'),
	userGroupBLL = require('./usergroup'),
	userModel = require('../entity/user'),
	userDAL = require('../dal/user');


// 主要属性验证
function validate(user, currentUser, callback) {
	var err;
	if ( !validator.isUsername(user.username) ) {
		err = '用户名必须为2-20个英文字母、数字或下划线';
	} else if (!user.groupid) {
		err = '用户组不能为空';
	} else if ( user.email && !validator.isEmail(user.email) ) {
		err = 'Email格式错误';
	} else if ( user.nickname && !validator.isNickname(user.nickname) ) {
		err = '昵称必须为2-20个字符';
	}

	if (err) {
		callback( util.createError(err) );
	} else {
		// 默认以用户名为昵称
		user.nickname = user.nickname || user.username;

		async.series([function(callback) {
			userDAL.findByName(user.username, user.nickname, function(err, result) {
				if (!err) {
					// 检查用户名和昵称是否有重复
					if ( result.some(function(u) { return u.userid != user.userid; }) ) {
						err = util.createError('用户名或昵称重复');
					}
				}
				callback(err);
			});
		}, function(callback) {
			userGroupBLL.read(user.groupid, function(err, result) {
				if (!err) {
					if (!result) {
						err = util.createError('用户组不存在');
					} else if (currentUser && currentUser.group.compare(result) < 0) {
						err = util.createError('权限不足');
					}
				}
				callback(err);
			});
		}], callback);
	}
}

// 检查密码强度
function checkPassword(password) {
	if (password.length < 6 || password.length > 16) { return '密码必须为6-16个字符'; }
	if ( /^\d+$/.test(password) ) { return '密码不能为纯数字'; }
	if ( /^[a-z]+$/i.test(password) ) { return '密码不能为纯英文'; }
}

// 加密密码
function encryptPassword(password) {
	return crypto.createHash('sha1').update(password).digest('hex');
}


exports.create = function(user, currentUser, callback) {
	var err = checkPassword(user.password);

	if (err) {
		callback( util.createError(err) );
	} else {
		validate(user, currentUser, function(err) {
			if (err) {
				callback(err);
			} else {
				// 密码加密
				user.password = encryptPassword(user.password);

				userDAL.create( user.toDbRecord(), userGroupBLL.addClearCacheAction(callback) );
			}
		});
	}
};

exports.update = function(user, userid, currentUser, callback) {
	if ( validator.isAutoId(userid) ) {
		user.userid = userid;
		// 基本权限验证在页面完成
		validate(user, currentUser, function(err) {
			if (err) {
				callback(err);
			} else {
				userDAL.update(
					user.toDbRecord(),
					userid,
					userGroupBLL.addClearCacheAction(callback)
				);
			}
		});
	} else {
		callback( util.createError('无效的用户编号') );
	}
};

exports.updatePassword = function(newPassword, oldPassword, username, callback) {
	// 管理员修改用户密码时，oldPassword应为null
	
	var err;
	if (!username) {
		err = '用户名不能为空';
	} else if ( !validator.isUsername(username) ) {
		err = '用户名无效';
	} else if (!newPassword) {
		err = '新密码不能为空';
	} else {
		err = checkPassword(newPassword);
	}

	if (!err && oldPassword != null) {
		if (!oldPassword) {
			err = '旧密码不能为空';
		} else if ( checkPassword(oldPassword) ) {
			err = '旧密码错误';
		}
	}

	if (err) {
		callback( util.createError(err) );
	} else {
		if (oldPassword != null) {
			oldPassword = encryptPassword(oldPassword);
		}
		userDAL.readByUsername(username, oldPassword, function(err, result) {
			if (!err && !result) {
				err = util.createError('用户不存在或旧密码错误');
			}
			if (err) {
				callback(err);
			} else {
				newPassword = encryptPassword(newPassword);
				userDAL.updatePassword(newPassword, username, function(err, result) {
					if (!err) {
						result.newPassword = newPassword;
					}
					callback(err, result);
				});
			}
		});
	}
};

// 更新最后在线时间、IP
var updateActivity = exports.updateActivity = function(ip, userid) {
	userDAL.updateActivity(new Date(), ip, userid);
};


exports.readByUserId = function(userid, callback) {
	if ( validator.isAutoId(userid) ) {
		userDAL.readByUserId(userid, function(err, result) {
			callback(err, result && result[0] ? userModel.createEntity(result[0]) : null);
		});
	} else {
		callback( util.createError('无效的用户编号') );
	}
};

exports.readByUsernameAndPassword = function(username, password, callback) {
	var err;
	if ( !username || !validator.isUsername(username) ) {
		err = '无效的用户名';
	} else if ( !password || password.length !== 40 ) {
		err = '无效的密码';
	}

	if (err) {
		callback( util.createError(err) );
	} else {
		userDAL.readByUsername(username, password, function(err, result) {
			callback(err, result && result[0] ? userModel.createEntity(result[0]) : null);
		});
	}
};


exports.delete = function(userids, callback) {
	if ( userids.some(function(id) { return !validator.isAutoId(id); }) ) {
		callback( util.createError('无效的用户编号') );
	} else {
		userDAL.delete( userids, userGroupBLL.addClearCacheAction(callback) );
	}
};


exports.list = function(params, pageSize, page, callback) {
	if (params) {
		if ( !validator.isAutoId(params.groupid) ) { delete params.groupid; }
	}

	userDAL.list(params, pageSize, page, function(err, result) {
		if (result && result.data) {
			result.data = result.data.map(function(user) {
				return userModel.createEntity(user);
			});
		}

		callback(err, result);
	});
};


// 记录登录重试操作
// 某IP对某帐号的重试达到一定次数后，在一段时间内封禁该IP对该帐号的登录，以防止暴力破解
var loginRetryHistory = {
	// 最大重试次数
	MAX_RETRY_TIME: 8,
	// 锁定时间
	LOCK_TIME: 20 * 60 * 1000,
	// 历史数据
	_data: { },

	// 增加历史记录或密码错误时调用
	add: function(key) {
		var history = this._data[key] = this._data[key] || {
			counter: 0
		};
		history.time = Date.now();
		history.counter++;
	},

	// 移除历史记录或登录成功后调用
	remove: function(key) { delete this._data[key]; },

	// 检查是否达到最大重试次数
	check: function(key) {
		var history = this._data[key];
		if (history) {
			if ( history.time + this.LOCK_TIME < Date.now() ) {
				delete this._data[key];
			} else if (history.counter > this.MAX_RETRY_TIME) {
				return false;
			}
		}
		return true;
	},

	// 清理过期的历史数据
	clean: function() {
		for (var key in this._data) { this.check(key); }
	}
};

// 定时清理过期的历史数据
setInterval(function() { loginRetryHistory.clean(); }, loginRetryHistory.LOCK_TIME);

// 登录
exports.login = function(username, password, ip, callback) {
	var err, historyKey = username + '-' + ip;

	if (!username) {
		err = '用户名不能为空';
	} else if ( !validator.isUsername(username) ) {
		err = '无效的用户名';
	} else if ( !password ) {
		err = '密码不能为空';
	} else if ( checkPassword(password) ) {
		err = '密码错误';
	} else if (!ip) {
		err = '非法的登录IP';
	} else if ( !loginRetryHistory.check(historyKey) ) {
		err = '重试次数太多，请过一段时间后再登录';
	}

	if (err) {
		callback( util.createError(err) );
	} else {
		userDAL.readByUsername(username, function(err, result) {
			if (err) {
				callback(err);
			} else {
				result = result[0];
				if (result) {
					if ( result.password !== encryptPassword(password) ) {
						// 密码错误，记录重试历史
						loginRetryHistory.add(historyKey);
						err = true;
					}
				} else {
					// 用户不存在
					err = true;
				}

				if (err) {
					callback( util.createError('用户不存在或密码错误') );
				} else {
					// 登录成功，移除密码错误记录
					loginRetryHistory.remove(historyKey);
					// 更新用户最后活动时间和IP
					updateActivity(ip, result.userid);

					callback( err, userModel.createEntity(result) );
				}
			}
		});
	}
};