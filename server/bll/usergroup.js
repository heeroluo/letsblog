const userGroupDAL = require('../dal/usergroup');
const PromiseCache = require('../lib/promise-cache');
const { isAutoId } = require('./validator/common');
const { validate } = require('./validator/usergroup');
const { createError, arrayToMap } = require('../lib/util');


// 用户组的改动较少，且经常用于权限判断
// 缓存在内存中可以避免频繁访问数据库
const listCache = new PromiseCache(async() => {
	const result = await userGroupDAL.list();
	return Object.freeze(
		(result || []).map((item) => { return Object.freeze(item); })
	);
});

// 向外暴露清理缓存的接口
const clearCache = exports.clearCache = () => { listCache.clear(); };


// 读取用户组数据列表
// type为true时返回map，否则返回数组
const list = exports.list = async(type) => {
	const result = await listCache.promise();
	return type ? arrayToMap(result, 'groupid') : result.slice();
};


// 读取单条用户组数据
const read = exports.read = async(id) => {
	const map = await list(true);
	return map[id];
};


// 创建用户组
exports.create = async(data) => {
	const err = validate(data);
	if (err) { throw createError(err, 400); }

	const result = await userGroupDAL.create(data);
	clearCache();
	return result;
};

// 更新用户组
exports.update = async(data, id) => {
	const err = isAutoId(id) ? validate(data) : '无效的用户组编号';
	if (err) { throw createError(err, 400); }

	await userGroupDAL.update(data, id);
	clearCache();
};


// 删除用户组
exports.delete = async(id) => {
	if (!isAutoId(id)) {
		throw createError('无效的用户组编号', 400);
	} else if (id <= 2) {
		throw createError('不能删除系统用户组', 400);
	}

	const userGroup = await read(id);
	if (!userGroup) {
		throw createError('用户组不存在');
	} else if (userGroup.totalusers) {
		throw createError('不能删除有用户的用户组');
	}

	await userGroupDAL.delete(id);
	clearCache();
};