/*!
 * LetsBlog
 * Entity model defination of link
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