/*!
 * LetsBlog
 * Entity model defination of category
 * Released under MIT license
 */

'use strict';

const EntityModel = require('./_entity-model');


module.exports = new EntityModel([
	{
		name: 'categoryid',
		type: 'int',
		isPrimaryKey: true,
		isDbGenerated: true,
		isUpdateIgnored: true
	},
	'categoryname',
	'categoryname_en',
	{
		name: 'weight',
		type: 'int'
	},
	{
		name: 'totalarticles',
		type: 'int',
		isUpdateIgnored: true,
		isDbGenerated: true
	}
], function() {
	this.href = '/article/list/' + this.categoryid;
	if (this['categoryname_en']) { this.href += '/' + this['categoryname_en']; }
});