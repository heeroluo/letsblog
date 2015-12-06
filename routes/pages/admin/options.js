/*!
 * LetsBlog
 * Routes of options management pages
 * Released under MIT license
 */

'use strict';

var util = require('../../../lib/util'),
	pageType = require('../../page-type'),
	optionsBLL = require('../../../bll/options');


// 权限验证
function checkPermission(req, res, next) {
	var err;
	if (!req.currentUser.group.perm_manage_option) {
		err = util.createError('权限不足', 403);
	}
	next(err);
}


// 修改网站设置操作界面
exports.update = {
	template: 'admin/options-form',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res, next) {
				return optionsBLL.read().then(function(result) {
					res.routeHelper.viewData('options', result);
				});
			}
		)
	)
};

// 提交网站设置修改
exports.update__post = {
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res, next) {
				var options = req.getEntity('options', 'update');
				return optionsBLL.update(options).then(function() {
					res.routeHelper.renderInfo(res, {
						message: '更新成功'
					});
				});
			}
		)
	)
};