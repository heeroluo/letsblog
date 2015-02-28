/*!
 * NodeBlog
 * Entity model defination of article (2015-02-21T16:42:35+0800)
 * Released under MIT license
 */

'use strict';

var EntityModel = require('./_entity-model');
module.exports = new EntityModel([
	{
		name: 'articleid',
		type: 'int',
		isPrimaryKey: true,
		isDbGenerated: true,
		isUpdateIgnored: true
	},
	'title',
	'title_en',
	'keywords',
	{ name: 'categoryid', type: 'int' },
	'summary',
	'content',
	{ name: 'weight', type: 'int' },
	{ name: 'userid', type: 'int', isUpdateIgnored: true },
	{ name: 'state', type: 'int' },
	{ name: 'pubtime', type: 'date' },
	{ name: 'totalviews', type: 'int', isUpdateIgnored: true, isDbGenerated: true },
	{ name: 'totalcomments', type: 'int', isUpdateIgnored: true, isDbGenerated: true },
], function() {
	this.href = '/article/detail/' + this.articleid;
	if (this.title_en) { this.href += '/' + this.title_en; }
	this.category_href = '/article/list/' + this.categoryid;
	if (this.categoryname_en) { this.category_href += '/' + this.categoryname_en; }
});