/*!
 * LetsBlog
 * Cache controller (2015-02-09T13:54:16+0800)
 * Released under MIT license
 */

'use strict';

var util = require('../lib/util');


/**
 * 缓存类
 * @class Cache
 * @constructor
 * @exports
 * @param {Function} dataLoader 加载数据的函数
 * @param {Object} [moduleExports] 如果不为空，则附加clearCache和addClearCacheAction方法
 * @param {Object} [options] 其他参数
 *   @param {Number} [options.expires] 过期时间，单位毫秒
 */
function Cache(dataLoader, moduleExports, options) {
	var t = this;
	t._dataLoader = dataLoader;

	if (options) { t._expires = Number(options.expires) || 0; }
	
	if (moduleExports) {
		moduleExports.clearCache = function() { t.clear(); };
		moduleExports.addClearCacheAction = function(fn) { return t.addClearAction(fn); };
	}
}

util.extend(Cache.prototype, {
	/**
	 * 获取数据
	 * @method get
	 * @for Cache
	 * @param {Function} callback 回调函数
	 */
	get: function(callback) {
		var t = this;

		// 如果已过期，则清空缓存
		if (t._result && t._expires && Date.now() - t._result.time > t._expires) {
			t.clear();
		}

		if (t._result) {
			callback(null, t._result.data);
		} else {
			// 把callback放入队列，加载到数据后按顺序执行
			if (!t._callbacks) { t._callbacks = [ ]; }
			t._callbacks.push(callback);

			// 防止重复加载
			if (t._isLoading) { return; }
			t._isLoading = true;

			t._dataLoader(function(err, data) {
				delete t._isLoading;

				if (!err) {
					t._result = {
						time: Date.now()
					};
					if (data != null) {
						t._result.data = data;
					}
				}
				// 执行队列
				if (t._callbacks) {
					t._callbacks.forEach(function(callback) {
						callback(err, t._result ? t._result.data : null);
					});
					delete t._callbacks;
				}
			});
		}
	},

	/**
	 * 清理缓存数据
	 * @method clear
	 * @for Cache
	 */
	clear: function() { delete this._result; },

	/**
	 * 返回一个新函数，该函数在清理缓存后执行指定函数
	 * @method addClearAction
	 * @for Cache
	 * @param {Function} fn 指定函数
	 * @return {Function} 新函数
	 */
	addClearAction: function(fn) {
		var t = this;
		return function(err) {
			if (!err) { t.clear(); }
			fn.apply(this, arguments);
		};
	}
});

module.exports = Cache;