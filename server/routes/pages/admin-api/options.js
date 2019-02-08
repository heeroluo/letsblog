/*!
 * LetsBlog
 * JSON APIs of options management
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const optionsBLL = require('../../../bll/options');


// 权限验证
function checkPermission(req) {
	if (!req.currentUser.usergroup.perm_manage_option) {
		return util.createError('权限不足', 403);
	}
}


// 加载网站设置数据
exports.read = [
	checkPermission,
	async(req, res) => {
		res.routeHelper.viewData('options', await optionsBLL.read());
	}
];


// 提交网站设置修改
exports.update = {
	verb: 'put',
	callbacks: [
		checkPermission,
		async(req) => {
			const options = req.getModel('options');
			await optionsBLL.update(options);
		}
	]
};