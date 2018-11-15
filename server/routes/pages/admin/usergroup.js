/*!
 * LetsBlog
 * Routes of usergroup management pages
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const pageType = require('../../page-type');
const userGroupBLL = require('../../../bll/usergroup');


// 权限验证
function checkPermission(req) {
	if (req.currentUser.usergroup.perm_manage_user < 2) {
		return util.createError('权限不足', 403);
	}
}


// 用户组列表页
exports.list = {
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			async(req, res) => {
				res.routeHelper.viewData('userGroupList', await userGroupBLL.list());
			}
		)
	)
};


// 创建用户组界面
exports.read = {
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			async(req, res) => {
				res.routeHelper.viewData('userGroup', await userGroupBLL.read(req.query.id));
			}
		)
	)
};

// 提交新用户组
exports.create = {
	verb: 'post',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			async(req) => {
				const userGroup = req.getModel('usergroup', req.body);
				await userGroupBLL.create(userGroup);
			}
		)
	)
};


// 提交用户组修改
exports.update = {
	verb: 'put',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			async(req) => {
				const userGroup = req.getModel('usergroup', req.body);
				await userGroupBLL.update(userGroup, userGroup.groupid);
			}
		)
	)
};


// 删除用户组
exports['delete'] = {
	verb: 'delete',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			async(req) => {
				await userGroupBLL.delete(parseInt(req.query.id));
			}
		)
	)
};