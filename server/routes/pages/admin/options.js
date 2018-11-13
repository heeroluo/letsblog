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


// 修改网站设置操作界面
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


// 提交网站设置修改
exports['update/post'] = {
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				const options = req.getEntity('options', 'update');
				return optionsBLL.update(options).then(() => {
					res.routeHelper.renderInfo(res, {
						message: '更新成功'
					});
				});
			}
		)
	)
};