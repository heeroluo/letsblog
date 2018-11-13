const categoryDAL = require('../dal/category');
const PromiseCache = require('../lib/promise-cache');
const { isAutoId } = require('./validator/common');
const { validate } = require('./validator/category');
const { createError, arrayToMap } = require('../lib/util');


// 分类的改动较少，且需要在导航栏中展示
// 缓存在内存中可以避免频繁访问数据库
const listCache = new PromiseCache(async() => {
	const result = await categoryDAL.list();
	return Object.freeze(
		(result || []).map((item) => { return Object.freeze(item); })
	);
});

// 暴露清理缓存的接口
const clearCache = exports.clearCache = () => { listCache.clear(); };


// 读取分类数据列表
// minWeight为最小（>=）权重值
// type为true时，返回map，否则返回数组
const list = exports.list = async(minWeight, type) => {
	// 重载，允许不传minWeight
	if (typeof minWeight === 'boolean') {
		type = minWeight;
		minWeight = 0;
	} else {
		minWeight = Number(minWeight) || 0;
	}

	let filter;
	// 根据最小权重过滤
	if (minWeight > 0) {
		filter = (category) => { return category.weight >= minWeight; };
	}

	const result = await listCache.promise();

	return type ? arrayToMap(result, 'categoryid', filter) :
		(filter ? result.filter(filter) : result.slice());
};


// 读取单条分类数据
const read = exports.read = async(id) => {
	const map = await list(true);
	return map[id];
};


// 创建分类
exports.create = async(data) => {
	const err = validate(data);
	if (err) { throw createError(err, 400); }

	const result = await categoryDAL.create(data);
	clearCache();
	return result;
};


// 更新分类
exports.update = async(data, id) => {
	const err = isAutoId(id) ? validate(data) : '无效的分类编号';
	if (err) { throw createError(err, 400); }

	await categoryDAL.update(data, id);
	clearCache();
};


// 删除分类
exports.delete = async(id) => {
	if (!isAutoId(id)) {
		throw createError('无效的分类编号', 400);
	}

	const category = await read(id);
	if (!category) {
		throw createError('分类不存在');
	} else if (category.totalarticles) {
		throw createError('不能删除有文章的分类');
	}

	await categoryDAL.delete(id);
	clearCache();
};