/*!
 * LetsBlog
 * Data access layer of user
 * Released under MIT license
 */

'use strict';

var crypto =  require('crypto'),
	Promise = require('bluebird'),
	util = require('../lib/util'),
	validator = require('../lib/validator'),
	userGroupBLL = require('./usergroup'),
	userModel = require('../entity/user'),
	userDAL = require('../dal/user');


// 创建和更新数据前的主要属性验证
function validate(user, currentUser) {
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

	if (err) { return util.createError(err); }

	// 默认以用户名为昵称
	user.nickname = user.nickname || user.username;

	return userDAL.findByName(user.username, user.nickname).then(function(result) {
		return result.some(function(u) { return u.userid != user.userid; }) ?
			util.createError('用户名或昵称重复') :
			userGroupBLL.read(user.groupid);
	}).then(function(result) {
		var err;
		if (!result) {
			err = '用户组不存在';
		} else if (currentUser && currentUser.group.compare(result) < 0) {
			err = '权限不足';
		}
		if (err) { return util.createError(err); }
	});
}

// 检查密码合法性和强度
function checkPassword(password) {
	if (password.length < 6 || password.length > 16) { return '密码必须为6-16个字符'; }
	if ( /^\d+$/.test(password) ) { return '密码不能为纯数字'; }
	if ( /^[a-z]+$/i.test(password) ) { return '密码不能为纯英文'; }
}

// 加密密码（SHA1）
function encryptPassword(password) {
	return crypto.createHash('sha1').update(password).digest('hex');
}


// 创建用户
// currentUser为当前操作用户，用于检查权限
exports.create = function(user, currentUser) {
	var err = checkPassword(user.password);
	return err ?
		util.createError(err) :
		validate(user, currentUser).then(function() {
			user.password = encryptPassword(user.password);
			return userDAL.create( user.toDbRecord() );
		}).then(userGroupBLL.clearCache);
};

// 更新用户（密码除外）
// currentUser为当前操作用户，用于检查权限
exports.update = function(user, userid, currentUser) {
	if ( !validator.isAutoId(userid) ) { return util.createError('无效的用户编号'); }

	user.userid = userid;
	// 基本权限验证在页面完成
	return validate(user, currentUser).then(function() {
		return userDAL.update(user.toDbRecord(), userid);
	}).then(userGroupBLL.clearCache);
};

// 更新密码
exports.updatePassword = function(newPassword, oldPassword, username) {
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

	if (err) { return util.createError(err); }

	if (oldPassword != null) { oldPassword = encryptPassword(oldPassword); }

	return userDAL.readByUsername(username, oldPassword).then(function(result) {
		if (!result) { return util.createError('用户不存在或旧密码错误'); }

		newPassword = encryptPassword(newPassword);
		return userDAL.updatePassword(newPassword, username).then(function(result) {
			result.newPassword = newPassword;
			return result;
		});
	});
};


// 更新最后在线时间、IP
var updateActivity = exports.updateActivity = function(ip, userid) {
	return userDAL.updateActivity(new Date(), ip, userid);
};


// 通过用户编号读取单条用户数据
exports.readByUserId = function(userid) {
	return validator.isAutoId(userid) ?
		userDAL.readByUserId(userid).then(function(result) {
			if (result[0]) {
				return userModel.createEntity(result[0]);
			}
		}) :
		util.createError('无效的用户编号');
};

// 通过用户名和密码读取单条用户记录（主要用于登录）
exports.readByUsernameAndPassword = function(username, password) {
	var err;
	if ( !username || !validator.isUsername(username) ) {
		err = '无效的用户名';
	} else if ( !password || password.length !== 40 ) {
		err = '无效的密码';
	}

	return err ?
		util.createError(err) :
		userDAL.readByUsername(username, password).then(function(result) {
			if (result[0]) {
				return userModel.createEntity(result[0]);
			}
		});
};


// 删除用户数据
exports.delete = function(userids) {
	var err;
	if (!userids.length) {
		err = '请指定要操作的用户';
	} else if ( userids.some(function(id) { return !validator.isAutoId(id); }) ) {
		err = '无效的用户编号';
	}

	return err ?
		util.createError(err) :
		userDAL.delete(userids).then(userGroupBLL.clearCache);
};


// 读取用户数据列表（带分页）
exports.list = function(params, pageSize, page) {
	if (params) {
		if ( !validator.isAutoId(params.groupid) ) { delete params.groupid; }
	}

	return userDAL.list(params, pageSize, page).then(function(result) {
		result.data = result.data.map(function(user) {
			return userModel.createEntity(user);
		});
		return result;
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

// 定时清理历史记录
setInterval(function() { loginRetryHistory.clean(); }, loginRetryHistory.LOCK_TIME);

// 登录
exports.login = function(username, password, ip) {
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
		return util.createError(err);
	} else {
		return userDAL.readByUsername(username).then(function(result) {
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
				return util.createError('用户不存在或密码错误');
			} else {
				// 登录成功，移除密码错误记录
				loginRetryHistory.remove(historyKey);
				// 更新用户最后活动时间和IP
				return updateActivity(ip, result.userid).then(function() {
					return userModel.createEntity(result);
				});
			}
		});
	}
};