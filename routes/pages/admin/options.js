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
	if (!req.currentUser.group.perm_manage_option) {
		return util.createError('权限不足', 403);
	}
}


// 修改网站设置操作界面
exports.update = {
	template: 'admin/options__form/options__form',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				return optionsBLL.read().then((result) => {
					res.routeHelper.viewData('options', result);
				});
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