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
 * 创建Error对象
 * @method createError
 * @param {String} msg 错误信息
 * @param {String|Number} [statusCode] 状态码
 */
exports.createError = (msg, statusCode) => {
	const err = new Error(msg);
	err.statusCode = statusCode || 500;
	return err;
};


/**
 * 把数组转换为map结构
 * @method arrayToMap
 * @param {Array} arr 数组
 * @param {String} keyName 键名
 * @param {Function} [filter] 过滤函数
 * @return {Object} map结构
 */
exports.arrayToMap = (arr, keyName, filter) => {
	const result = {};
	arr.forEach(function(item) {
		if (!filter || filter.apply(this, arguments) === true) {
			result[item[keyName]] = item;
		}
	});
	return result;
};