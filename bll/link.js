/*!
 * LetsBlog
 * Business logic layer of link
 * Released under MIT license
 */

'use strict';

const util = require('../lib/util');
const validator = require('../lib/validator');
const Cache = require('./_cache');
const linkModel = require('../entity/link');
const linkDAL = require('../dal/link');


// 链接的改动较少，且需要在列表页（首页）展示
// 缓存在内存中可以避免频繁访问数据库
const listCache = new Cache(() => {
	return linkDAL.list().then((result) => {
		// 冻结对象，防止因意外修改导致脏数据的出现
		return Object.freeze(
			(result || []).map((link) => {
				return Object.freeze(linkModel.createEntity(link));
			})
		);
	});
});

// 向外暴露清理缓存的接口
const clearCache = exports.clearCache = () => { listCache.clear(); };


// 读取链接数据列表
// minWeight为最小（>=）权重值
const list = exports.list = (minWeight) => {
	minWeight = Number(minWeight) || 0;

	let filter;
	// 根据最小权重过滤
	if (minWeight > 0) {
		filter = (link) => { return link.weight >= minWeight; };
	}

	return listCache.promise().then((result) => {
		return filter ? result.filter(filter) : result;
	});
};


// 读取单条链接数据
exports.read = (linkid) => {
	return validator.isAutoId(linkid) ?
		list().then((result) => {
			for (let i = result.length - 1; i >= 0; i--) {
				if (result[i].linkid == linkid) { return result[i]; }
			}
		}) :
		util.createError('无效的链接编号');
};


// 创建和更新数据前的验证
function validate(link) {
	if (!link.linkname) { return '站名不能为空'; }
	if (!link.siteurl) { return '链接不能为空'; }
	if (link.weight < 0 || link.weight > 255) { return '权重必须为0-255间的整数'; }

	// XXX 暂时不做图片链接
	link.logourl = '';
}

// 创建链接
exports.create = (link) => {
	const err = validate(link);
	return err ?
		util.createError(err) :
		linkDAL.create(link.toDbRecord()).then(clearCache);
};

// 更新链接
exports.update = (link, linkid) => {
	const err = validator.isAutoId(linkid) ? validate(link) : '无效的链接编号';
	return err ?
		util.createError(err) :
		linkDAL.update(link.toDbRecord(), linkid).then(clearCache);
};


// 删除链接
exports.delete = (linkid) => {
	return validator.isAutoId(linkid) ?
		linkDAL.delete(linkid).then(clearCache) :
		util.createError('无效的链接编号');
};