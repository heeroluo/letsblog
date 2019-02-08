/*!
 * LetsBlog
 * JSON APIs of usergroup management
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const userGroupBLL = require('../../../bll/usergroup');


// 权限验证
function checkPermission(req) {
	if (req.currentUser.usergroup.perm_manage_user < 2) {
		return util.createError('权限不足', 403);
	}
}


// 用户组列表
exports.list = [
	checkPermission,
	async(req, res) => {
		res.routeHelper.viewData(
			'userGroupList',
			await userGroupBLL.list()
		);
	}
];


// 加载单个用户组数据
exports.read = [
	checkPermission,
	async(req, res) => {
		res.routeHelper.viewData(
			'userGroup',
			await userGroupBLL.read(req.query.id)
		);
	}
];


// 提交新用户组
exports.create = {
	verb: 'post',
	callbacks: [
		checkPermission,
		async(req) => {
			const userGroup = req.getModel('usergroup');
			await userGroupBLL.create(userGroup);
		}
	]
};


// 提交用户组修改
exports.update = {
	verb: 'put',
	callbacks: [
		checkPermission,
		async(req) => {
			const userGroup = req.getModel('usergroup');
			await userGroupBLL.update(userGroup, userGroup.groupid);
		}
	]
};


// 删除用户组
exports['delete'] = {
	verb: 'delete',
	callbacks: [
		checkPermission,
		async(req) => {
			await userGroupBLL.delete(parseInt(req.query.id));
		}
	]
};