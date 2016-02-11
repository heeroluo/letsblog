/*!
 * LetsBlog
 * Article list page - v1.1 (2016-02-11T11:23:02+0800)
 * Released under MIT license
 */
define(function(require, exports, module) { 'use strict';

var $ = require('dom/1.1.x/'),
	header = require('/common/header/1.0.x/'),
	share = require('/common/share/1.0.x/');


$('#article-list .article-list__item').forEach(function(item) {
	var titleLink = $('.article-list__item__header__title a', item);

	$('.share-ico', item).click(function(e) {
		e.preventDefault();
		share.to(this.getAttribute('data-sharetype'), {
			title: titleLink.text(),
			url: titleLink.prop('href')
		});
	});
});

});