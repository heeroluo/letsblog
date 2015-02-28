/*!
 * LetsBlog
 * Paginator generator (2015-02-25T11:23:50+0800)
 * Released under MIT license
 */

'use strict';


var DEFAULT_TEMPLATE = '<ol class="paginator">' +
'<% if (currentPage > 1) { %>' +
	'<li class="paginator-item paginator-prev"><a href="<%=prevHref%>" data-page="<%=(currentPage - 1)%>"><span class="paginator-ico-text"></span></a></li>' +
'<% } else { %>' +
	'<li class="paginator-item paginator-prev paginator-prev-disabled"><span class="paginator-ico-text"></span></li>' +
'<% } %>' +
'<% pageNumbers.forEach(function(obj) { %>' +
	'<% if (obj.current) { %>' +
	'<li class="paginator-item paginator-number paginator-current"><span><%=obj.page%></span></li>' +
	'<% } else if (obj.page === "...") { %>' +
	'<li class="paginator-item paginator-ellipsis"><span class="paginator-ico-text"></span></li>' +
	'<% } else { %>' +
	'<li class="paginator-item paginator-number"><a href="<%=obj.href%>" data-page="<%=obj.page%>"><%=obj.page%></a></li>' +
	'<% } %>' +
'<% }); %>' +
'<% if (currentPage < totalPages) { %>' +
	'<li class="paginator-item paginator-next"><a href="<%=nextHref%>" data-page="<%=(currentPage + 1)%>"><span class="paginator-ico-text"></span></a></li>' +
'<% } else { %>' +
	'<li class="paginator-item paginator-next paginator-next-disabled"><span class="paginator-ico-text"></span></li>' +
'<% } %>' +
'</ol>';

module.exports = function(currentPage, totalPages, hrefPattern, options) {
	options = options || { };

	var numberOfPagesToShow = options.numberOfPagesToShow || 7,
		numberOfPagesPerSide = parseInt( (numberOfPagesToShow - 1) / 2 ),
		data = [ ];
	
	currentPage = currentPage || 1;
	hrefPattern = hrefPattern || '?page=<%=page%>';

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

	var ejs = require('ejs');

	var prevHref, nextHref;
	data.forEach(function(d) {
		if (typeof d.page === 'number') {
			d.href = ejs.render(hrefPattern, {
				page: d.page
			});
			if (d.page === currentPage + 1) {
				nextHref = d.href;
			} else if (d.page === currentPage - 1) {
				prevHref = d.href;
			}
		}
	});

	return ejs.render(options.template || DEFAULT_TEMPLATE, {
		currentPage: currentPage,
		totalPages: totalPages,
		pageNumbers: data,
		nextHref: nextHref,
		prevHref: prevHref
	});
};