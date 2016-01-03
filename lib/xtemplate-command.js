/*!
 * LetsBlog
 * XTemplate commands
 * Released under MIT license
 */

'use strict';

var util = require('./util');


// JSON序列化
exports.jsonEncode = function(scope, option) {
	return JSON.stringify(option.params[0]);
};


// 对象是否存在
exports.exists = function(scope, option) {
	var obj = option.params[0], result = obj != null;
	if (result) {
		if ( Array.isArray(obj) ) {
			result = obj.length > 0;
		} else if (typeof obj === 'string') {
			result = obj.trim() !== '';
		}
	}
	return result;
};


// 格式化日期
exports.formatDate = function(scope, option) {
	return util.formatDate(option.params[0], option.params[1]);
};

// 格式化日期为距离现在多长时间的格式
exports.formatDateFromNow = function(scope, option) {
	return util.formatDateFromNow(option.params[0]);
};


// 转换成URL参数
exports.toQueryString = function(scope, option) {
	var data = option.params[0], addPagePlaceholder = option.params[1];

	var result = [ ];
	for (var d in data) {
		if (data[d] != null && data[d] !== '') {
			result.push( encodeURIComponent(d) + '=' + encodeURIComponent(data[d]) );
		}
	}

	// 增加页码参数占位符
	if (addPagePlaceholder) { result.push('page={{page}}'); }

	return result.join('&amp;');
};


// 创建分页条数据模型
exports.createPaginator = function(scope, option) {
	var currentPage = parseInt(option.params[0]) || 1,
		totalPages = parseInt(option.params[1]),
		href = option.params[2] || '?page={{page}}';

	// 一共显示多少个页码项
	var howManyPagesToShow = 3;
	// 当前页左右两边每边显示多少个页码项
	var howManyPagesPerSide = parseInt( (howManyPagesToShow - 1) / 2 );

	// 当前页及其左右两侧的页码
	var start = currentPage - howManyPagesPerSide,
		end = currentPage + howManyPagesPerSide,
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

	if (end - start + 1 < howManyPagesToShow) {
		if (end < totalPages) {
			end++;
		} else if (start > 1) {
			start--;
		}
	}

	var data = [ ];
	for (var i = start; i <= end; i++) {
		data.push({
			page: i,
			current: i == currentPage
		});
	}

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

	var prevHref, nextHref;
	data.forEach(function(d) {
		if (typeof d.page === 'number') {
			d.href = href.replace('{{page}}', d.page);
			if (d.page === currentPage + 1) {
				nextHref = d.href;
			} else if (d.page === currentPage - 1) {
				prevHref = d.href;
			}
		}
	});

	return {
		currentPage: currentPage,
		totalPages: totalPages,
		pageNumbers: data,
		nextHref: nextHref,
		prevHref: prevHref
	};
};