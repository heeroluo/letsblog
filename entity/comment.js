/*!
 * LetsBlog
 * Entity model defination of comment
 * Released under MIT license
 */

'use strict';

var EntityModel = require('./_entity-model');


module.exports = new EntityModel([
	{
		name: 'commentid',
		type: 'int',
		isPrimaryKey: true,
		isDbGenerated: true,
		isUpdateIgnored: true
	},
	{
		name: 'userid',
		type: 'int',
		isUpdateIgnored: true
	},
	'user_nickname',
	'user_email',
	'user_qq',
	{
		name: 'articleid',
		type: 'int',
		isUpdateIgnored: true
	},
	'content',
	{
		name: 'pubtime',
		type: 'date',
		isUpdateIgnored: true
	},
	'ip',
	{ name: 'state', type: 'int' }
], function() {
	this.article_href = '/article/detail/' + this.articleid;
	if (this.article_title_en) {
		this.article_href += '/' + this.article_title_en;
	}
});