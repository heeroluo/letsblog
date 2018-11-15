const optionsDAL = require('../dal/options');
const PromiseCache = require('../lib/promise-cache');
const { validate } = require('./validator/options');
const { createError } = require('../lib/util');


// 网站设置只有一条记录，缓存之
const myCache = new PromiseCache(async() => {
	const result = await optionsDAL.read();
	if (result) {
		return Object.freeze(result);
	} else {
		throw createError('网站设置数据缺失');
	}
});

// 暴露清理缓存的接口
const clearCache = exports.clearCache = () => { myCache.clear(); };

// 读取单条网站设置记录
exports.read = async() => { return myCache.promise(); };


// 更新网站设置
exports.update = async(data) => {
	const err = validate(data);
	if (err) { throw createError(err, 400); }

	await optionsDAL.update(data);
	clearCache();
};