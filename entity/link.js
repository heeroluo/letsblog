/*!
 * NodeBlog
 * Entity model defination of link (2015-02-07T12:09:29+0800)
 * Released under MIT license
 */

'use strict';

var EntityModel = require('./_entity-model');
module.exports = new EntityModel([
	{
		name: 'linkid',
		type: 'int',
		isPrimaryKey: true,
		isDbGenerated: true,
		isUpdateIgnored: true
	},
	'linkname',
	'siteurl',
	'logourl',
	'introduction',
	{ name: 'weight', type: 'int' }
]);