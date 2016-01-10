/*!
 * LetsBlog
 * Entity model defination of user group
 * Released under MIT license
 */

'use strict';

var EntityModel = require('./_entity-model');
module.exports = new EntityModel([
	{
		name: 'groupid',
		type: 'int',
		isPrimaryKey: true,
		isDbGenerated: true,
		isUpdateIgnored: true
	},
	'groupname',
	{ name: 'perm_article', type: 'int' },
	{ name: 'perm_comment', type: 'int' },
	{ name: 'perm_manage_option', type: 'int' },
	{ name: 'perm_manage_user', type: 'int' },
	{ name: 'perm_manage_article', type: 'int' },
	{ name: 'perm_manage_comment', type: 'int' },
	{
		name: 'totalusers',
		isDbGenerated: true,
		isUpdateIgnored: true,
		type: 'int'
	}
], null, {
	// 对比权限
	// -2: 当前用户组与目标用户组权限各有不同
	// -1: 当前用户组权限比目标用户组低
	//  0: 当前用户组权限与目标用户组相同
	// 	1: 当前用户组权限比目标用户组高
	compare: function(target) {
		var result = 0, temp;

		for (var key in target) {
			if ( target.hasOwnProperty(key) && /^perm_/.test(key) ) {
				temp = 0;	// 重置

				if (this[key] < target[key]) {
					temp = -1;
				} else if (this[key] > target[key]) {
					temp = 1;
				}

				if (temp) {
					if (result) {
						if (result != temp) { return -2; }
					} else {
						result = temp;
					}
				}
			}
		}

		return result;
	}
});