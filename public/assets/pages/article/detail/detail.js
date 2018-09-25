const $ = require('lib/dom@1.1');
const share = require('components/share/share');
const Comment = require('components/comment/comment');


$('.share-btn').click(function() {
	share.to(this.getAttribute('data-sharetype'), {
		title: document.title,
		url: window.location.href
	});
});

const $comment = $('#comment');
new Comment({
	listWrapper: $comment.find('.comment__list'),
	form: $comment.find('.comment__form'),
	page: 1,
	articleId: window.articleId,
	events: {
		submitsuccess: function(e) {
			$('.comment__total').text(e.result.totalRows);
		}
	}
});