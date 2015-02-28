/*!
 * NodeBlog
 * Entity model defination of options (2015-02-07T12:09:27+0800)
 * Released under MIT license
 */

'use strict';

var EntityModel = require('./_entity-model');
module.exports = new EntityModel([
	'sitename',
	'siteurl',
	'keywords',
	'description',
	{ name: 'isopen', type: 'int' },
	'tipstext',
	'statcode'
]);