/*!
 * LetsBlog
 * Business logic layer of category
 * Released under MIT license
 */

'use strict';

const util = require('../lib/util');
const validator = require('../lib/validator');
const Cache = require('./_cache');
const categoryModel = require('../entity/category');
const categoryDAL = require('../dal/category');


// 分类的改动较少，且需要在导航栏中展示
// 缓存在内存中可以避免频繁访问数据库
const listCache = new Cache(() => {
	return categoryDAL.list().then((result) => {
		// 冻结对象，防止因意外修改导致脏数据的出现
		return Object.freeze(
			(result || []).map((category) => {
				return Object.freeze(categoryModel.createEntity(category));
			})
		);
	});
});

// 向外暴露清理缓存的接口
const clearCache = exports.clearCache = () => {
	listCache.clear();
};


// 读取分类数据列表
// minWeight为最小（>=）权重值
// type为true时，返回map，否则返回数组
const list = exports.list = (minWeight, type) => {
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

	return listCache.promise().then((result) => {
		return type ?
			util.arrayToMap(result, 'categoryid', filter) :
			(filter ? result.filter(filter) : result);
	});
};


// 读取单条分类数据
const read = exports.read = (categoryid) => {
	return list(true).then((result) => {
		return result[categoryid];
	});
};


// 创建和更新数据前的验证
function validate(category) {
	if (!category.categoryname) {
		return '分类名不能为空';
	}
	if (category.categoryname_en && !validator.isEnTitle(category.categoryname_en)) {
		return '英文分类名只能包含小写字母、数字和连字符';
	}
	if (category.weight < 0 || category.weight > 255) {
		return '权重必须为0-255间的整数';
	}
}

// 创建分类
exports.create = (category) => {
	const err = validate(category);
	return err ?
		util.createError(err) :
		categoryDAL.create(category.toDbRecord()).then(clearCache);
};

// 更新分类
exports.update = (category, categoryid) => {
	const err = validator.isAutoId(categoryid) ? validate(category) : '无效的分类编号';
	return err ?
		util.createError(err) :
		categoryDAL.update(category.toDbRecord(), categoryid).then(clearCache);
};


// 删除分类
exports.delete = (categoryid) => {
	if (!validator.isAutoId(categoryid)) {
		return util.createError('无效的分类编号');
	}

	return read(categoryid).then((result) => {
		let err;
		if (!result) {
			err = '分类不存在';
		} else if (result.totalarticles) {
			err = '不能删除有文章的分类';
		}

		return err ?
			util.createError(err) :
			categoryDAL.delete(categoryid).then(clearCache);
	});
};