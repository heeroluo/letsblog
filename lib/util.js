/*!
 * LetsBlog
 * 工具函数
 */

'use strict';


/**
 * 对指定对象的每个元素执行指定函数
 * @method each
 * @param {Object|Array|ArrayLike} obj 目标对象
 * @param {Function(value,key,obj)} callback 操作函数，上下文为当前元素。
 *   当返回值为false时，遍历中断
 * @return {Object|Array|ArrayLike} 遍历对象
 */
exports.each = function(obj, callback) {
	if (obj != null) {
		let i;
		const len = obj.length;
		if (len === undefined || typeof obj === 'function') {
			for (i in obj) {
				if (obj.hasOwnProperty(i) && false === callback.call(obj[i], obj[i], i, obj)) {
					break;
				}
			}
		} else {
			i = -1;
			while (++i < len) {
				if (false === callback.call(obj[i], obj[i], i, obj)) {
					break;
				}
			}
		}
	}

	return obj;
};


/**
 * 判断指定字符串是否URL
 * @method isURL
 * @param {String} str 指定字符串
 * @return {String} 指定字符串是否URL
 */
exports.isURL = function(str) { return /^([a-z]+:)?\/\//i.test(str); };


/**
 * 把数组转换为map结构
 * @method arrayToMap
 * @param {Array} arr 数组
 * @param {String} keyName 键名
 * @param {Function} [filter] 过滤函数
 * @return {Object} map结构
 */
exports.arrayToMap = function(arr, keyName, filter) {
	const result = {};
	arr.forEach(function(item) {
		if (!filter || filter.apply(this, arguments) === true) {
			result[item[keyName]] = item;
		}
	});
	return result;
};


/**
 * 类型转换
 * @method convert
 * @param {Any} val 要转换的值
 * @param {String} type 目标类型：number-数字；int-整数；date-日期；array-数组
 * @return {Any} 转换结果
 */
exports.convert = (function() {
	// 各种类型转换函数
	const typeConverter = {
		// 转换成数字
		'number': function(val) {
			return Number(val) || 0;
		},
		// 转换成整数
		'int': function(val) {
			return parseInt(Number(val)) || 0;
		},
		// 转换成日期
		'date': function(val) {
			val = new Date(val);
			if (isNaN(val.getTime())) { val = new Date(0); }
			return val;
		},
		// 转换成字符串
		'string': function(val) {
			return val == null ? '' : String(val);
		},
		// 转换成数组
		'array': function(val, options) {
			if (Array.isArray(val)) {
				return val;
			} else {
				if (typeof val === 'string' && val !== '') {
					return val.split((options || { }).separator || /\s*,\s*/);
				} else {
					return [];
				}
			}
		}
	};

	return (val, type) => {
		let memberType;

		// 识别 Array<Type>
		type = type.replace(/<([a-z]+)>$/, (match, $1) => {
			memberType = $1;
			return '';
		});

		if (typeConverter[type]) {
			val = typeConverter[type](val);
			if (memberType) {
				if (Array.isArray(val)) {
					for (let i = val.length - 1; i >= 0; i--) {
						val[i] = typeConverter[memberType](val[i]);
					}
				} else {
					for (let i in val) {
						val[i] = typeConverter[memberType](val[i]);
					}
				}
			}
		}

		return val;
	};
})();


/**
 * 创建拒绝状态的Promise
 * @method createError
 * @param {String} msg 错误信息
 * @param {Number} [status=200] HTTP错误状态
 * @return {Error|Promise} 错误对象
 */
exports.createError = function(msg, status) {
	const err = new Error(msg);
	err.status = status || 200;

	return Promise.reject(err);
};


/**
 * 串行执行若干个Promise实例
 * @method promiseSeries
 * @param {Array} promiseCreators 返回promise实例的函数数组
 * @return {Promise} Promise实例
 */
exports.promiseSeries = function(promiseCreators) {
	let lastPromise;
	promiseCreators.forEach(function(promiseCreator) {
		if (lastPromise) {
			lastPromise = lastPromise.then(function() {
				return promiseCreator();
			});
		} else {
			lastPromise = promiseCreator();
		}
	});

	return lastPromise;
};