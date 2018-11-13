/**
 * 基于Promise的缓存类
 * @class PromiseCache
 * @constructor
 * @exports
 * @param {Function} createPromise 创建数据请求的promise
 * @param {Object} [options] 其他参数
 *   @param {Number} [options.expires] 过期时间（毫秒），0为不过期
 */
class PromiseCache {
	constructor(createPromise, options) {
		this._createPromise = createPromise;
		options = options || { };
		this._expires = Number(options.expires) || 0;
	}

	/**
	 * 获取请求数据的promise实例
	 * @method promise
	 * @for Cache
	 * @return {Promise} promise实例
	 */
	promise() {
		const t = this;

		// 判断缓存数据是否已过期
		if (t._promise && t._expires && Date.now() - t._lastTime > t._expires) {
			t.clear();
		}

		if (!t._promise) {
			t._promise = t._createPromise().then((result) => {
				t._lastTime = Date.now();
				return result;
			});
		}
		return t._promise;
	}

	/**
	 * 清理缓存数据
	 * @method clear
	 * @for Cache
	 */
	clear() {
		delete this._lastTime;
		delete this._promise;
	}
}

module.exports = PromiseCache;