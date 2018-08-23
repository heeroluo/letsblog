/*!
 * LetsBlog
 * Routes of usergroup management pages
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const pageType = require('../../page-type');
const userGroupModel = require('../../../entity/usergroup');
const userGroupBLL = require('../../../bll/usergroup');


// 权限验证
function checkPermission(req) {
	if (req.currentUser.group.perm_manage_user < 2) {
		return util.createError('权限不足', 403);
	}
}


// 用户组列表页
exports.list = pageType.admin(
	pageType.prepend(
		checkPermission,
		(req, res) => {
			return userGroupBLL.list().then((result) => {
				res.routeHelper.viewData('userGroupList', result);
			});
		}
	)
);


// 创建用户组界面
exports.create = {
	template: 'admin/usergroup__form/usergroup__form',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res, next) => {
				res.routeHelper.viewData('userGroup', userGroupModel.createEntity());
				next();
			}
		)
	)
};

// 提交新用户组
exports['create/post'] = {
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				const userGroup = req.getEntity('usergroup', 'insert');
				return userGroupBLL.create(userGroup).then(() => {
					res.routeHelper.renderInfo(res, {
						message: '已创建新用户组 ' + userGroup.groupname
					});
				});
			}
		)
	)
};


// 修改用户组界面
exports.update = {
	pathPattern: '/usergroup/update/:groupid',
	template: 'admin/usergroup__form/usergroup__form',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				return userGroupBLL.read(parseInt(req.params.groupid)).then((result) => {
					if (result) {
						res.routeHelper.viewData('userGroup', result);
					} else {
						return util.createError('用户组不存在', 404);
					}
				});
			}
		)
	)
};

// 提交用户组修改
exports['update/post'] = {
	pathPattern: '/usergroup/update/:groupid/post',
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				const userGroup = req.getEntity('usergroup', 'update');
				return userGroupBLL.update(
					userGroup,
					parseInt(req.params.groupid)
				).then(() => {
					res.routeHelper.renderInfo(res, {
						message: '已更新用户组 ' + userGroup.groupname
					});
				});
			}
		)
	)
};


// 删除用户组
exports['delete/post'] = {
	pathPattern: '/usergroup/delete/:groupid/post',
	verb: 'post',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				return userGroupBLL.delete(parseInt(req.params.groupid)).then(() => {
					res.routeHelper.renderInfo(res, {
						message: '已删除指定用户组'
					});
				});
			}
		)
	)
};