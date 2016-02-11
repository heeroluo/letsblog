/*!
 * LetsBlog
 * Article detail page - v1.1 (2016-02-11T16:24:45+0800)
 * Released under MIT license
 */
define(function(require, exports, module) { 'use strict';

var $ = require('dom/1.1.x/'),
	share = require('/common/share@1.0.x'),
	Comment = require('/common/comment@1.0.x');


$('.share-btn').click(function(e) {
	e.preventDefault();
	share.to(this.getAttribute('data-sharetype'), {
		title: document.title,
		url: window.location.href
	});
});


var commentForm = $('#comment__form');

// 加载评论
new Comment({
	listWrapper: $('#comment__list'),
	form: commentForm,
	page: 1,
	articleId: commentForm.find('input[name=articleid]').val(),
	events: {
		submitsuccess: function(e) {
			$('.comment__total').text(e.result.totalRows);
		}
	}
});

});