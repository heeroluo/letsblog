'use strict';

var util = require('../util/util');


exports.css =
exports.js =
exports.modjs = function(scope, option, buffer) {
	var empty = '';
	return option.fn ?  buffer.write(empty) : empty;
};


function toString(str) {
	return str == null ? '' : String(str);
}

// 编码HTML实体
exports.escape = (function() {
	// HTML特殊字符及其对应的编码内容
	var re_entity = [ ], entityMap = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;'
	};
	for (var key in entityMap) { re_entity.push(key); }
	var re_entity = new RegExp('[' + re_entity.join('') + ']', 'g');

	return function(scope, option) {
		return toString(option.params[0]).replace(re_entity, function(match) {
			return entityMap[match];
		});
	};
})();

// 把换行符替换成<br />
exports.nl2br = function(scope, option) {
	return toString(option.params[0]).replace(/\r?\n/g, '<br />');
};

// 把空白替换成
exports.space2nbsp = function(scope, option) {
	return toString(option.params[0]).replace(/\s{2,}/g, function(match) {
		return new Array(match.length + 1).join('&nbsp;');
	});
};


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

	return result.join('&');
};

// 创建分页条数据模型
exports.createPaginator = function(scope, option) {
	var currentPage = parseInt(option.params[0]) || 1,
		totalPages = parseInt(option.params[1]),
		href = option.params[2] || '?page={{page}}';

	var howManyPageItems = 7,
		howManyPageItemsPerSide = parseInt( (howManyPageItems - 1) / 2 ),
		data = [ ];

	var start = currentPage - howManyPageItemsPerSide,
		end = currentPage + howManyPageItemsPerSide,
		startOverflow = start - 1,
		endOverflow = totalPages - end;

	// 把左侧剩余的页码额度移到右侧
	if (startOverflow < 0) {
		start = 1;
		end = Math.min(totalPages, end - startOverflow);
	}
	// 把右侧剩余的页码移到左侧
	if (endOverflow < 0) {
		end = totalPages;
		if (startOverflow > 0) { start = Math.max(1, start + endOverflow); }
	}

	// 处理 howManyPageItems 为双数，减一后除不尽的情况
	if (howManyPageItems % 2 === 0) {
		if (start > 1) {
			start--;
		} else if (end < totalPages) {
			end++;
		}
	}

	// 开始页码大于1，但第一页一定要显示，所以要减一个额度
	if (start > 1) { start++; }
	// 结束页码小于总页数，但最后一页一定要显示，所以要减一个额度
	if (end < totalPages) { end--; }

	// 补充第一页到开始页
	if (start - 1) {
		data.push({
			page: 1,
			current: false
		}, {
			page: '...'
		});
	}

	for (var i = start; i <= end; i++) {
		data.push({
			page: i,
			current: i == currentPage
		});
	}

	// 补充结束页到末页
	if (totalPages - end) {
		data.push({
			page: '...'
		}, {
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