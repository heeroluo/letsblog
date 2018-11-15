/*!
 * LetsBlog
 * Routes of options management pages
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const pageType = require('../../page-type');
const optionsBLL = require('../../../bll/options');


// 权限验证
function checkPermission(req) {
	if (!req.currentUser.usergroup.perm_manage_option) {
		return util.createError('权限不足', 403);
	}
}


// 加载配置数据
exports.read = {
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			async(req, res) => {
				res.routeHelper.viewData('options', await optionsBLL.read());
			}
		)
	)
};


// 更新网站设置
exports.update = {
	verb: 'put',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			async(req) => {
				const options = req.getModel('options', req.body);
				await optionsBLL.update(options);
			}
		)
	)
};