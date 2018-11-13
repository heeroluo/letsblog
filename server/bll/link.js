const linkDAL = require('../dal/link');
const PromiseCache = require('../lib/promise-cache');
const { isAutoId } = require('./validator/common');
const { validate } = require('./validator/link');
const { createError } = require('../lib/util');


// 链接的改动较少，且需要在列表页（首页）中展示
// 缓存在内存中可以避免频繁访问数据库
const listCache = new PromiseCache(async() => {
	const result = await linkDAL.list();
	return Object.freeze(
		(result || []).map((item) => { return Object.freeze(item); })
	);
});

// 暴露清理缓存的接口
const clearCache = exports.clearCache = () => { listCache.clear(); };


// 读取链接数据列表
// minWeight为最小（>=）权重值
const list = exports.list = async(minWeight) => {
	minWeight = Number(minWeight) || 0;

	let filter;
	// 根据最小权重过滤
	if (minWeight > 0) {
		filter = (link) => { return link.weight >= minWeight; };
	}

	const result = await listCache.promise();
	return filter ? result.filter(filter) : result.slice();
};


// 读取单条链接数据
exports.read = async(id) => {
	if (!isAutoId(id)) {
		throw createError('无效的链接编号', 400);
	}

	const result = await list();
	for (let i = result.length - 1; i >= 0; i--) {
		if (result[i].linkid === id) {
			return result[i];
		}
	}
};


// 创建链接
exports.create = async(data) => {
	const err = validate(data);
	if (err) { throw createError(err, 400); }

	const result = await linkDAL.create(data);
	clearCache();
	return result;
};

// 更新链接
exports.update = async(data, id) => {
	const err = isAutoId(id) ? validate(data) : '无效的链接编号';
	if (err) { throw createError(err, 400); }

	await linkDAL.update(data, id);
	clearCache();
};


// 删除链接
exports.delete = async(id) => {
	if (!isAutoId(id)) {
		throw createError('无效的链接编号', 400);
	}

	await linkDAL.delete(id);
	clearCache();
};