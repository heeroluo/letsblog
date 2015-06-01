/*!
 * LetsBlog
 * Route handler definations (2015-06-01T09:20:19+0800)
 * Released under MIT license
 */

'use strict';

var util = require('../lib/util');


// 为了避免往res对象中写入过多属性或方法
// 把这些逻辑全部封装到RouteHandler中
// 然后把RouteHandler挂到res对象


/**
 * 路由基类
 * @class BasicRouteHandler
 * @constructor
 * @param {String} pageTemplate 页面模板
 */
var BasicRouteHandler = util.createClass(function(pageTemplate) {
	this._data = { };
	this._info = { status: 1 };
	this._pageTemplate = pageTemplate;
	this.type = 'basic';
}, {
	/**
	 * 设置视图数据
	 * @method setData
	 * @for BasicRouteHandler
	 * @param {String} key 键
	 * @param {Any} value 值
	 */
	/**
	 * 设置视图数据
	 * @method setData
	 * @for BasicRouteHandler
	 * @param {Object} map 键值对
	 */
	setData: function(key, value) {
		if (typeof key === 'object') {
			util.extend(this._data, key);
		} else {
			this._data[key] = value;
		}
	},

	/**
	 * 获取视图数据
	 * @method getData
	 * @for BasicRouteHandler
	 * @param {String} key 键
	 * @return {Any} 值
	 */
	getData: function(key) { return this._data[key]; },

	/**
	 * 渲染
	 * @method _render
	 * @protected
	 * @for BasicRouteHandler
	 * @param {Object} res Response对象
	 * @param {String} template 模板
	 * @param {Object} data 数据
	 */
	_render: function(res, template, data) { res.render(template, data); },

	/**
	 * 渲染视图
	 * @method render
	 * @for BasicRouteHandler
	 * @param {Object} res Response对象
	 */
	render: function(res) { this._render(res, this._pageTemplate, this._data); },

	/**
	 * 渲染提示信息
	 * @method render
	 * @protected
	 * @for BasicRouteHandler
	 */
	_renderInfo: function(res) { this._render(res, this._infoTemplate, this._info); },

	/**
	 * 渲染状态信息
	 * @method renderInfo
	 * @for BasicRouteHandler
	 * @param {Object} info 状态信息对象
	 * @param {Object} res Response对象
	 */
	renderInfo: function(res, info) {
		util.extend(this._info, this._data, info);
		this._info.backURL = this._info.backURL || res.req.get('Referer');
		this._infoTemplate = res.req.originalUrl.indexOf('/admin/') === 0 ? 'admin/info' : 'info';
		this._renderInfo(res);
	}
});
exports.BasicRouteHandler = BasicRouteHandler;


/**
 * JSON路由
 * @class HTMLRouteHandler
 * @extends BasicRouteHandler
 * @constructor
 */
var JSONRouteHandler = util.createClass(function() {
	this.type = 'json';
}, {
	_resData: function() {
		return util.extend({ }, this._info, { data: this._data });
	},
	_render: function(res, data) { res.json(data); },
	render: function(res) { this._render(res, this._resData()); },
	_renderInfo: function(res) {
		var info = this._info;
		if (info.httpStatus) { res.status(info.httpStatus); }
		this._render(res, info);
	}
}, BasicRouteHandler);
exports.JSONRouteHandler = JSONRouteHandler;


/**
 * JSONP路由
 * @class HTMLRouteHandler
 * @extends BasicRouteHandler
 * @constructor
 */
var JSONPRouteHandler = util.createClass(function() {
	this.type = 'jsonp';
}, {
	_render: function(res, data) { res.jsonp(data); }
}, JSONRouteHandler);
exports.JSONPRouteHandler = JSONPRouteHandler;


/**
 * 创建错误处理路由
 * @method createErrorRoute
 * @param {Boolean} isDevEnv 是否开发环境
 */
exports.createErrorRouteHandler = function(isDevEnv) {
	return function(err, req, res, next) {
		if (typeof err === 'string') { err = new Error(err); }

		err.status = err.status || 500;
		res.status(err.status);

		try {
			res.routeHandler.renderInfo(res, {
				status: 2,
				httpStatus: err.status,
				message: err.message || '',
				stack: isDevEnv ? err.stack : ''
			});
		} catch (e) {
			res.end();
			throw e;
		}
	};
};