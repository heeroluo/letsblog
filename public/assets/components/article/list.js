const $ = require('lib/dom@1.1');
const share = require('components/share/share');

$('body').on('click', function() {
	const $article = $(this).parents('.article-list__item');
	const $link = $article.find('.article-list__item__header__title a');
	if ($link.length) {
		share.to(this.getAttribute('data-sharetype'), {
			title: $link.text(),
			url: $link.prop('href')
		});
	}
}, {
	delegator: '.share-ico'
});