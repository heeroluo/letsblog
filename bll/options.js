/*!
 * LetsBlog
 * Business logic layer of options
 * Released under MIT license
 */

'use strict';

var	Promise = require('bluebird');
var util = require('../lib/util');
var optionsModel = require('../entity/options');
var optionsDAL = require('../dal/options');
var Cache = require('./_cache');


// 网站设置只有一条记录，缓存之
var myCache = new Cache(function() {
	return optionsDAL.list().then(function(result) {
		if (result && result.length) {
			return Object.freeze(
				optionsModel.createEntity(result[0])
			);
		}
	});
});

// 向外暴露清空缓存的接口
var clearCache = exports.clearCache = function() {
	myCache.clear();
};


// 读取单条网站设置记录
exports.read = function() { return myCache.promise(); };


// 更新数据前执行的验证
function validate(options) {
	if (!options.sitename) { return '网站名称不能为空'; }
	if (!options.siteurl) { return '网站URL不能为空'; }
	if ([0, 1].indexOf(options.isopen) === -1) { return '网站开关参数错误'; }

	// 容错处理，中文逗号替换为英文逗号
	options.keywords = options.keywords.replace(/，/g, ',');
}

// 更新网站设置
exports.update = function(options) {
	var err = validate(options);
	return err ?
		util.createError(err) :
		optionsDAL.update(options.toDbRecord()).then(clearCache);
};