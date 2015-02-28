/*!
 * LetsBlog
 * Business logic layer of options (2015-02-09T13:50:58+0800)
 * Released under MIT license
 */

'use strict';

var	util = require('../lib/util'),
	Cache = require('./_cache'),
	optionsModel = require('../entity/options'),
	optionsDAL = require('../dal/options');


var currentOptions = new Cache(function(setCache) {
	optionsDAL.list(function(err, result) {
		setCache(
			err,
			result ? Object.freeze( optionsModel.createEntity(result[0]) ) : null
		);
	});
}, exports);
var addClearCacheAction = exports.addClearCacheAction;


exports.read = function(callback) { currentOptions.get(callback); };


function validate(options) {
	if (!options.sitename) { return '网站名称不能为空'; }
	if (!options.siteurl) { return '网站URL不能为空'; }
	if ([0, 1].indexOf(options.isopen) === -1) { return '网站开关参数错误'; }

	// 容错处理，中文逗号替换为英文逗号
	options.keywords = options.keywords.replace(/，/g, ',');
}

exports.update = function(options, callback) {
	var err = validate(options);
	if (err) {
		callback( util.createError(err) );
	} else {
		optionsDAL.update( options.toDbRecord(), addClearCacheAction(callback) );
	}
};