/*!
 * LetsBlog
 * Business logic layer of category (2015-02-21T18:46:54+0800)
 * Released under MIT license
 */

'use strict';

var util = require('../lib/util'),
	validator = require('../lib/validator'),
	Cache = require('./_cache'),
	categoryModel = require('../entity/category'),
	categoryDAL = require('../dal/category');


var allCategories = new Cache(function(setCache) {
	categoryDAL.list(function(err, result) {
		setCache( err, Object.freeze(
			(result || [ ]).map(function(category) {
				return Object.freeze( categoryModel.createEntity(category) );
			})
		) );
	});
}, exports);
var addClearCacheAction = exports.addClearCacheAction;


var list = exports.list = function(callback, minWeight, type) {
	minWeight = Number(minWeight) || 0;

	var filter;
	// 根据最小权重过滤
	if (minWeight > 0) {
		filter = function(category) { return category.weight >= minWeight; };
	}

	allCategories.get(function(err, result) {
		if (result) {
			// type为true时，返回map，否则返回数组
			result = type ?
				util.arrayToMap(result, 'categoryid', filter) :
				( filter ? result.filter(filter) : result );
		}
		callback(err, result);
	});
};

var read = exports.read = function(categoryid, callback) {
	list(function(err, result) {
		var category;
		if (result) {
			for (var i = result.length - 1; i >= 0; i--) {
				if (result[i].categoryid == categoryid) {
					category = result[i];
					break;
				}
			}
		}
		callback(err, category);
	});
};


function validate(category) {
	if (!category.categoryname) {
		return '分类名不能为空';
	}
	if ( category.categoryname_en && !validator.isEnTitle(category.categoryname_en) ) {
		return '英文分类名只能包含小写字母、数字和连字符';
	}
	if (category.weight < 0 || category.weight > 255) {
		return '权重必须为0-255间的整数';
	}
}

exports.create = function(category, callback) {
	var err = validate(category);
	if (err) {
		callback(util.createError(err));
	} else {
		categoryDAL.create(category.toDbRecord(), addClearCacheAction(callback));
	}
};

exports.update = function(category, categoryid, callback) {
	var err = validator.isAutoId(categoryid) ? validate(category) : '无效的分类编号';
	if (err) {
		callback(util.createError(err));
	} else {
		categoryDAL.update(category.toDbRecord(), categoryid, addClearCacheAction(callback));
	}
};


exports.delete = function(categoryid, callback) {
	if ( validator.isAutoId(categoryid) ) {
		read(categoryid, function(err, result) {
			if (!err) {
				if (!result) {
					err = util.createError('分类不存在');
				} else if (result.totalarticles) {
					err = util.createError('不能删除有文章的分类');
				}
			}
			if (err) {
				callback(err);
			} else {
				categoryDAL.delete(categoryid, addClearCacheAction(callback));
			}
		});
	} else {
		callback( util.createError('无效的分类编号') );
	}
};