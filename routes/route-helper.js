/*!
 * LetsBlog
 * Route helper
 *   In order to avoid mounting too many properties or methods to the res object,
 *   move these properties and methods to route helper class.
 *   And then only mount the route helper object to the res object.
 * Released under MIT license
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
		res.end();
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
exports.HTMLRouteHelper = util.createClass(function(template) {
	this.resetTitle();
	this.resetKeywords();
	this._type = 'html';
}, {
	/**
	 * 重置标题
	 * @method resetTitle
	 * @for HTMLRouteHelper
	 */
	resetTitle: function() { this._title = [ ]; },

	/**
	 * 在当前标题之前追加标题
	 * @method prependTitle
	 * @for HTMLRouteHelper
	 * @param {String|Array<String>} newTitle 追加的标题
	 */
	prependTitle: function(newTitle) {
		if ( Array.isArray(newTitle) ) {
			this._title = newTitle.concat(this._title);
		} else {
			this._title.unshift(newTitle);
		}
	},

	/**
	 * 在当前标题之后追加标题
	 * @method title
	 * @for HTMLRouteHelper
	 * @param {String|Array<String>} newTitle 追加的标题
	 */
	appendTitle: function(newTitle) {
		if ( Array.isArray(newTitle) ) {
			this._title = this._title.concat(newTitle);
		} else {
			this._title.push(newTitle);
		}
	},

	/**
	 * 重置关键词
	 * @method resetKeywords
	 * @for HTMLRouteHelper
	 */
	resetKeywords: function() { this._keywords = [ ]; },

	/**
	 * 追加关键词
	 * @method appendKeywords
	 * @for HTMLRouteHelper
	 * @param {String|Array<String>} newKeywords 追加的关键词
	 */
	appendKeywords: function(newKeywords) {
		if ( Array.isArray(newKeywords) ) {
			this._keywords = this._keywords.concat(newKeywords);
		} else {
			this._keywords.push(newKeywords);
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
		if (viewData.title == null && viewData.fullTitle == null) {
			viewData.title = this._title;
			viewData.fullTitle = this._title.join(' | ');
		}
		if (viewData.keywords == null && viewData.fullKeywords == null) {
			viewData.keywords = this._keywords;
			viewData.fullKeywords = this._keywords.join(',');
		}

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