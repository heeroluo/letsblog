/*!
 * JRaiser 2 Javascript Library
 * paginator - v1.1.0 (2015-02-22T20:47:16+0800)
 * http://jraiser.org/ | Released under MIT license
 */
define(function(require, exports, module) { 'use strict';

/**
 * 分页条组件
 * @module paginator/1.0.x/
 * @category Widget
 */

var widget = require('widget/1.0.x/'), tmpl = require('tmpl/2.1.x/');


/**
 * 分页条组件类
 * @class Paginator
 * @extends widget/1.0.x/{WidgetBase}
 * @constructor
 * @exports
 * @param {Object} options 组件设置
 *   @param {NodeList} [options.wrapper] 分页条容器
 *   @param {Number} [options.currentPage=1] 当前页
 *   @param {Number} [options.totalPages] 总页数
 *   @param {Number} [options.numberOfPagesToShow=7] 显示页码数
 *   @param {String} [options.prevText='上一页'] 上一页文字
 *   @param {String} [options.nextText='下一页'] 下一页文字
 *   @param {String} [options.ellipsisText='...'] 省略符文字
 *   @param {String} [options.template] 分页条HTML模版，一般情况下不建议修改
 */
return widget.create(function(options) {

}, {
	_init: function(options) {
		var t = this, wrapper = options.wrapper;

		if (!wrapper) { return; }

		// 写入分页条HTML
		wrapper.empty().html( tmpl.render(options.template, {
			currentPage: options.currentPage,
			totalPages: options.totalPages,
			pageNumbers: t._build(),
			nextText: options.nextText,
			prevText: options.prevText,
			ellipsisText: options.ellipsisText
		}) );

		/**
		 * 点击分页条中的链接时触发
		 * @event click
		 * @param {Object} e 事件参数
		 *   @param {Number} e.page 页码
		 * @for Paginator
		 */
		wrapper.find('a').click(function(e) {
			e.preventDefault();
			t.trigger('click', {
				page: parseInt( this.getAttribute('data-page') ) || 1
			});
		});
	},

	_destroy: function(options) {
		if (options.wrapper) { options.wrapper.empty();	}
	},

	_build: function() {
		var options = this._options, totalPages = options.totalPages;
		if (totalPages < 1) { return; }

		var numberOfPagesToShow = options.numberOfPagesToShow,
			numberOfPagesPerSide = parseInt( (numberOfPagesToShow - 1) / 2 ),
			currentPage = options.currentPage || 1,
			data = [ ];

		// 当前页及其前后两侧的页码
		var start = currentPage - numberOfPagesPerSide,
			end = currentPage + numberOfPagesPerSide,
			startOverflow = start - 1,
			endOverflow = totalPages - end;

		if (startOverflow < 0) {
			start = 1;
			end = Math.min(totalPages, end - startOverflow);
		}
		if (endOverflow < 0) {
			end = totalPages;
			if (startOverflow > 0) { start = Math.max(1, start + endOverflow); }
		}

		// 处理 numberOfPagesToShow 为双数，减一后除不尽的情况
		if (end - start + 1 < numberOfPagesToShow) {
			if (end < totalPages) {
				end++;
			} else if (start > 1) {
				start--;
			}
		}

		for (var i = start; i <= end; i++) {
			data.push({
				page: i,
				current: i == currentPage
			});
		}

		// 补充首页到开始页
		var temp = start - 1;
		if (temp) {
			if (temp > 2) {
				data.unshift({
					page: '...'
				});
			} else if (temp > 1) {
				data.unshift({
					page: 2,
					current: false
				});
			}
			data.unshift({
				page: 1,
				current: false
			});
		}

		// 补充结束页到末页
		temp = totalPages - end;
		if (temp) {
			if (temp > 2) {
				data.push({
					page: '...'
				});
			} else if (temp > 1) {
				data.push({
					page: end + 1,
					current: false
				});
			}
			data.push({
				page: totalPages,
				current: false
			});
		}

		return data;
	}
}, {
	currentPage: 1,
	numberOfPagesToShow: 7,
	prevText: '上一页',
	nextText: '下一页',
	ellipsisText: '...',
	template:
'<ol class="paginator">' +
'<% if (currentPage > 1) { %>' +
	'<li class="paginator__item paginator__item--prev">' +
		'<a href="#" data-page="<%=(currentPage - 1)%>" class="paginator__item__text">' +
			'<span class="paginator__item__text__icon"><%=prevText%></span>' +
		'</a>' +
	'</li>' +
'<% } else { %>' +
	'<li class="paginator__item paginator__item--prev paginator__item--prev--disabled">' +
		'<span class="paginator__item__text">' +
			'<span class="paginator__item__text__icon"><%=prevText%></span>' +
		'</span>' +
	'</li>' +
'<% } %>' +
'<% pageNumbers.forEach(function(obj) { %>' +
	'<% if (obj.current) { %>' +
	'<li class="paginator__item paginator__item--number paginator__item--current">' +
		'<span class="paginator__item__text"><%=obj.page%></span>' +
	'</li>' +
	'<% } else if (obj.page === "...") { %>' +
	'<li class="paginator__item paginator__item--ellipsis">' +
		'<span class="paginator__item__text">' +
			'<span class="paginator__item__text__icon"><%=ellipsisText%></span>' +
		'</span>' +
	'</li>' +
	'<% } else { %>' +
	'<li class="paginator__item paginator__item--number">' +
		'<a href="#" data-page="<%=obj.page%>" class="paginator__item__text"><%=obj.page%></a>' +
	'</li>' +
	'<% } %>' +
'<% }); %>' +
'<% if (currentPage < totalPages) { %>' +
	'<li class="paginator__item paginator__item--next">' +
		'<a href="#" data-page="<%=(currentPage + 1)%>" class="paginator__item__text">' +
			'<span class="paginator__item__text__icon"><%=nextText%></span>' +
		'</a>' +
	'</li>' +
'<% } else { %>' +
	'<li class="paginator__item paginator__item--next paginator__item--next--disabled">' +
		'<span class="paginator__item__text">' +
			'<span class="paginator__item__text__icon"><%=nextText%></span>' +
		'</span>' +
	'</li>' +
'<% } %>' +
'</ol>'
});

});