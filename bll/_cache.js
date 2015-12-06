/*!
 * LetsBlog
 * Cache controller
 * Released under MIT license
 */

'use strict';

var util = require('../lib/util');


/**
 * 缓存类
 * @class Cache
 * @constructor
 * @exports
 * @param {Function} createPromise 创建数据请求Promise实例的函数
 * @param {Object} [options] 其他参数
 *   @param {Number} [options.expires] 过期时间（单位毫秒）
 */
module.exports = util.createClass(function(createPromise, options) {
	var t = this;
	t._createPromise = createPromise;

	if (options) { t._expires = Number(options.expires) || 0; }
}, {
	/**
	 * 获取请求数据的Promise实例
	 * @method promise
	 * @for Cache
	 * @return {Promise} Promise实例
	 */
	promise: function() {
		var t = this;

		// 判断数据是否已过期
		if (t._promise && t._expires && Date.now() - t._lastTime > t._expires) {
			t.clear();
		}

		if (!t._promise) { t._promise = t._createPromise(); }

		return t._promise;
	},

	/**
	 * 清理缓存数据
	 * @method clear
	 * @for Cache
	 */
	clear: function() {
		delete this._lastTime;
		delete this._promise;
	}
});