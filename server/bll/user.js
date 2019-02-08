const userDAL = require('../dal/user');
const userGroupBLL = require('./usergroup');
const { isAutoId, isUsername } = require('./validator/common');
const { comparePerm } = require('./validator/usergroup');
const { validate, checkPassword, checkListParams } = require('./validator/user');
const { createError } = require('../lib/util');


// 创建和更新资料时检查合法性
async function validateMain(user, currentUser) {
	const err = validate(user);
	if (err) { return err; }

	const users = await userDAL.listByName(user.username, user.nickname);
	if (users.some((u) => { return u.userid != user.userid; })) {
		return '用户名或昵称重复';
	}

	const usergroup = await userGroupBLL.read(user.groupid);
	if (!usergroup) {
		return '用户组不存在';
	} else if (currentUser && comparePerm(currentUser.usergroup, usergroup) < 0) {
		return '权限不足';
	}
}

// 加密密码（SHA1）
function encryptPassword(password) {
	const crypto = require('crypto');
	return crypto.createHash('sha1').update(password).digest('hex');
}

// 创建用户
// currentUser为当前操作用户，用于检查权限
exports.create = async(user, currentUser) => {
	const err = checkPassword(user.password) || await validateMain(user, currentUser);
	if (err) {
		throw createError(err, 400);
	}

	user.password = encryptPassword(user.password);
	const result = await userDAL.create(user);

	// 创建用户后，用户组的用户数会变化，要清空缓存
	userGroupBLL.clearCache();

	return result;
};


// 更新用户资料
// currentUser为当前操作用户，用于检查权限
exports.updateProfile = async(user, userid, currentUser) => {
	if (!isAutoId(userid)) {
		throw createError('无效的用户编号', 400);
	}

	user.userid = userid;
	const err = await validateMain(user, currentUser);
	if (err) { throw createError(err, 400); }

	await userDAL.updateProfile(user, userid);
	// 可能修改了所属用户组，导致用户组的用户数变化
	userGroupBLL.clearCache();
};

// 更新密码
exports.updatePassword = async(newPassword, oldPassword, username) => {
	// 管理员修改用户密码时，oldPassword应为 null

	let err;
	if (!username) {
		err = '用户名不能为空';
	} else if (!isUsername(username)) {
		err = '用户名无效';
	} else if (!newPassword) {
		err = '新密码不能为空';
	} else {
		err = checkPassword(newPassword);
	}
	if (!err && oldPassword != null) {
		if (!oldPassword) {
			err = '旧密码不能为空';
		} else if (checkPassword(oldPassword)) {
			err = '旧密码错误';
		}
	}
	if (err) { throw createError(err, 400); }

	if (oldPassword != null) {
		oldPassword = encryptPassword(oldPassword);
	}

	const user = await userDAL.readByUsername(username, oldPassword);
	if (!user) {
		throw createError('用户不存在或旧密码错误', 400);
	}

	newPassword = encryptPassword(newPassword);
	await userDAL.updatePassword(newPassword, username);
	user.newPassword = newPassword;

	return user;
};

// 更新最后在线时间、IP
const updateActivity = exports.updateActivity = async(ip, id) => {
	await userDAL.updateActivity(new Date(), ip, id);
};


// 删除用户数据
exports.delete = async(ids) => {
	if (!ids.length) {
		throw createError('请指定要操作的用户', 400);
	} else if (ids.some((id) => { return !isAutoId(id); })) {
		throw createError('无效的用户编号', 400);
	}

	await userDAL.delete(ids);
	// 用户组的用户数会减少
	userGroupBLL.clearCache();
};


// 通过用户编号读取单条用户数据
exports.readByUserId = async(id) => {
	if (!isAutoId(id)) {
		throw createError('无效的用户编号');
	}
	const user = await userDAL.readByUserId(id);
	if (user) {
		user.usergroup = await userGroupBLL.read(user.groupid);
	}
	return user;
};

// 通过用户名和密码读取单条用户记录（主要用于登录）
exports.readByUsernameAndPassword = async(username, password) => {
	if (!username || !isUsername(username)) {
		throw createError('无效的用户名', 400);
	} else if (!password || password.length !== 40) {
		throw createError('无效的密码', 40);
	}

	const user = await userDAL.readByUsername(username, password);
	if (user) {
		user.usergroup = await userGroupBLL.read(user.groupid);
	}
	return user;
};


// 读取用户数据列表（带分页）
exports.list = async(pageSize, page, params) => {
	if (params) {
		const err = checkListParams(params);
		if (err) { throw createError(err, 400); }
	}
	return userDAL.list(pageSize, page, params);
};


// 记录登录重试操作
// 某IP对某帐号的重试达到一定次数后，在一段时间内封禁该IP对该帐号的登录，以防止暴力破解
const loginRetryHistory = {
	// 最大重试次数
	MAX_RETRY_TIME: 8,
	// 锁定时间
	LOCK_TIME: 20 * 60 * 1000,
	// 历史数据
	_data: {},

	// 增加历史记录或密码错误时调用
	add(key) {
		const history = this._data[key] = this._data[key] || {
			counter: 0
		};
		history.time = Date.now();
		history.counter++;
	},

	// 移除历史记录或登录成功后调用
	remove(key) { delete this._data[key]; },

	// 检查是否达到最大重试次数
	check(key) {
		const history = this._data[key];
		if (history) {
			if (history.time + this.LOCK_TIME < Date.now()) {
				delete this._data[key];
			} else if (history.counter > this.MAX_RETRY_TIME) {
				return false;
			}
		}
		return true;
	},

	// 清理过期的历史数据
	clean() {
		Object.keys(this._data).forEach((key) => {
			this.check(key);
		});
	}
};

// 定时清理历史记录
setInterval(() => {
	loginRetryHistory.clean();
}, loginRetryHistory.LOCK_TIME);

// 登录
exports.login = async(username, password, ip) => {
	let err;
	const historyKey = username + '-' + ip;
	if (!username) {
		err = '用户名不能为空';
	} else if (!isUsername(username)) {
		err = '无效的用户名';
	} else if (!password) {
		err = '密码不能为空';
	} else if (checkPassword(password)) {
		err = '密码错误';
	} else if (!ip) {
		err = '非法的登录IP';
	} else if (!loginRetryHistory.check(historyKey)) {
		err = '重试次数太多，请过一段时间再登录';
	}

	if (err) {
		throw createError(err, 400);
	}

	const result = await userDAL.readByUsername(username);
	if (result) {
		if (result.password !== encryptPassword(password)) {
			// 密码错误，记录重试历史
			loginRetryHistory.add(historyKey);
			err = true;
		}
	} else {
		err = true;
	}

	if (err) {
		throw createError('用户不存在或密码错误', 400);
	}

	// 登录成功，移除密码错误记录
	loginRetryHistory.remove(historyKey);
	// 更新用户最后活动时间和IP
	await updateActivity(ip, result.userid);

	return result;
};