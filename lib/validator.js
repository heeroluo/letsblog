/*!
 * LetsBlog
 * Validation functions (2015-02-22T19:00:43+0800)
 * Released under MIT license
 */

'use strict';


// 是否Email
exports.isEmail = function(val) {
	var temp = /^[\w-]+(?:\.[\w-]+)*@[\w-]+(?:\.[\w-]+)*\.[a-zA-Z]{2,}$/.test(val);
	if (temp) {
		temp = val.replace('@', '.').split('.');
		for (var i = temp.length - 2; i >= 0; i--) {
			if ( /^[-_]/.test(temp[i]) || /[_-]$/.test(temp[i]) ) {
				return false;
			}
		}
	} else {
		return false;
	}

	return true;
};

// 是否用户名
exports.isUsername = function(val) { return /^\w{2,20}$/.test(val); };

// 是否昵称
exports.isNickname = function(val) { return val.length >= 2 && val.length <= 20; };

// 是否自动编号
exports.isAutoId = function(val) {
	val = Number(val);
	return !isNaN(val) && val > 0;
};

// 是否英文标题
exports.isEnTitle = function(val) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val); };

// 是否QQ号
exports.isQQ = function(val) { return /^[1-9]\d{4,}$/.test(val); };