/*!
 * LetsBlog
 * Entity model defination of options
 * Released under MIT license
 */

'use strict';

const EntityModel = require('./_entity-model');


module.exports = new EntityModel([
	'sitename',
	'siteurl',
	'keywords',
	'description',
	{
		name: 'isopen',
		type: 'int'
	},
	'tipstext',
	'statcode'
]);