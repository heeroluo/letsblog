/*!
 * 路由辅助器
 * 为了避免往res对象中挂载过多属性或方法，
 * 把这些逻辑全部封装到RouteHelper对象中，
 * 然后把RouteHelper对象挂载到res对象
 */

'use strict';

var util = require('../lib/util');


/**
 * 路由辅助器基类
 * @class BasicRouteHelper
 * @constructor
 * @param {String} template 页面模板
 */
var BasicRouteHelper = util.createClass(function(template) {
	this._viewData = { };
	this._template = template;
	this._type = 'basic';
}, {
	/**
	 * 获取路由辅助器类型
	 * @for BasicRouteHelper
	 * @return {String} 路由辅助器类型
	 */
	type: function() { return this._type; },

	/**
	 * 获取视图数据
	 * @method viewData
	 * @for BasicRouteHelper
	 * @param {String} key 键
	 * @return {Any} 值
	 */
	/**
	 * 设置视图数据
	 * @method viewData
	 * @for BasicRouteHelper
	 * @param {String} key 键
	 * @param {Any} value 值
	 */
	/**
	 * 设置视图数据
	 * @method viewData
	 * @for BasicRouteHelper
	 * @param {Object} map 键值对
	 */
	viewData: function(key, value) {
		var viewData = this._viewData;
		if (arguments.length === 1 && typeof key === 'string') {
			return viewData[key];
		} else {
			if (typeof key === 'object') {
				util.extend(viewData, key);
			} else {
				viewData[key] = value;
			}
		}
	},

	/**
	 * 获取或追加标题
	 * @method title
	 * @for BasicRouteHelper
	 */
	title: function() { },

	/**
	 * 获取或追加关键词
	 * @method keywords
	 * @for BasicRouteHelper
	 */
	keywords: function() { },

	/**
	 * 渲染视图
	 * @method render
	 * @for BasicRouteHelper
	 * @param {Object} res Response对象
	 */
	render: function(res) {
		this._rendered = true;
		res.end();
	},

	/**
	 * 渲染提示信息
	 * @method renderInfo
	 * @for BasicRouteHelper
	 * @param {Object} res Response对象
	 */
	renderInfo: function(res, info) {
		this._rendered = true;
		res.json(info);
	},

	/**
	 * 获取是否已渲染视图
	 * @method rendered
	 * @for BasicRouteHelper
	 * @return {Boolean} 是否已渲染视图
	 */
	rendered: function() { return !!this._rendered; }
});


/**
 * HTML路由辅助器
 * @class HTMLRouteHelper
 * @constructor
 * @extends {BasicRouteHelper}
 * @param {String} template 页面模板
 */
exports.HTMLRouteHelper = util.createClass(function() {
	this._title = [ ];
	this._keywords = [ ];
	this._type = 'html';
}, {
	/**
	 * 获取标题
	 * @method title
	 * @for HTMLRouteHelper
	 * @return {String} 标题
	 */
	/**
	 * 追加标题
	 * @method title
	 * @for HTMLRouteHelper
	 * @param {String|Array<String>} appendedTitle 追加的标题
	 */
	title: function(appendedTitle) {
		var title = this._title;
		if (arguments.length) {
			if ( Array.isArray(appendedTitle) ) {
				this._title = appendedTitle.concat(title);
			} else {
				title.unshift(appendedTitle);
			}
			this._viewData.firstTitle = title[0];
		} else {
			return title.join(' | ');
		}
	},

	/**
	 * 获取关键词
	 * @method keywords
	 * @for HTMLRouteHelper
	 * @return {String} 关键词
	 */
	/**
	 * 追加关键词
	 * @method keywords
	 * @for HTMLRouteHelper
	 * @param {String|Array<String>} appendedKeywords 追加的关键词
	 */
	keywords: function(appendedKeywords) {
		var keywords = this._keywords;
		if (arguments.length) {
			if ( Array.isArray(appendedKeywords) ) {
				this._keywords = keywords.concat(appendedKeywords);
			} else {
				keywords.push(appendedKeywords);
			}
		} else {
			return keywords.join(',');
		}
	},

	/**
	 * 渲染视图
	 * @method render
	 * @for HTMLRouteHelper
	 * @param {Object} res Response对象
	 */
	render: function(res) {
		var viewData = this._viewData;
		viewData.title = this.title();
		viewData.keywords = this.keywords();
		res.render(this._template, viewData);
		this._rendered = true;
	},

	/**
	 * 渲染提示信息
	 * @method renderInfo
	 * @for HTMLRouteHelper
	 * @param {Object} res Response对象
	 */
	renderInfo: function(res, info) {
		info.backURL = info.backURL || res.req.get('Referer');
		info.status = info.status || 1;
		this.viewData('info', info);
		this._template = 'pages/' + (
			res.req.originalUrl.indexOf('/admin/') === 0 ? 'admin/info' : 'info'
		);
		this.render(res);
	}
}, BasicRouteHelper);


/**
 * JSON路由辅助器
 * @class JSONRouteHelper
 * @constructor
 * @extends {BasicRouteHelper}
 * @param {String} template 页面模板
 */
exports.JSONRouteHelper = util.createClass(function() {
	this._viewDataWrap = { status: 1 };
	this._type = 'json';
}, {
	render: function(res) {
		this._viewDataWrap.data = this._viewData;
		res.json(this._viewDataWrap);
		this._rendered = true;
	},

	renderInfo: function(res, info) {
		util.extend(this._viewDataWrap, info);
		this.render(res);
	}
}, BasicRouteHelper);