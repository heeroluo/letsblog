'use strict';


var util = require('../util/util');


exports.css =
exports.js =
exports.modjs = function(scope, option, buffer) {
	var empty = '';
	return option.fn ?  buffer.write(empty) : empty;
};


// JSON序列化
exports.jsonEncode = function(scope, option) {
	return JSON.stringify(option.params[0]);
};


// 对象是否存在
exports.exists = function(scope, option) {
	var obj = option.params[0], result = obj != null;
	if (result) {
		if ( Array.isArray(obj) ) {
			result = obj.length > 0;
		} else if (typeof obj === 'string') {
			result = obj.trim() !== '';
		}
	}
	return result;
};


// 格式化日期
exports.formatDate = function(scope, option) {
	return util.formatDate(option.params[0], option.params[1]);
};

// 格式化日期为距离现在多长时间的格式
exports.formatDateFromNow = function(scope, option) {
	return util.formatDateFromNow(option.params[0]);
};