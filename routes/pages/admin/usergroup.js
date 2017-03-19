/*!
 * LetsBlog
 * Routes of usergroup management pages
 * Released under MIT license
 */

'use strict';

var util = require('../../../lib/util'),
	pageType = require('../../page-type'),
	userGroupModel = require('../../../entity/usergroup'),
	userGroupBLL = require('../../../bll/usergroup');


// 权限验证
function checkPermission(req, res, next) {
	if (req.currentUser.group.perm_manage_user < 2) {
		return util.createError('权限不足', 403);
	}
}


// 用户组列表页
exports.list = pageType.admin(
	pageType.prepend(
		checkPermission,
		function(req, res, next) {
			return userGroupBLL.list().then(function(result) {
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
			function(req, res, next) {
				res.routeHelper.viewData( 'userGroup', userGroupModel.createEntity() );
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
			function(req, res, next) {
				var userGroup = req.getEntity('usergroup', 'insert');
				return userGroupBLL.create(userGroup).then(function() {
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
			function(req, res, next) {
				return userGroupBLL.read( parseInt(req.params.groupid) ).then(function(result) {
					if (result) {
						res.routeHelper.viewData('userGroup', result);
					} else {
						throw util.createError('用户组不存在', 404);
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
			function(req, res, next) {
				var userGroup = req.getEntity('usergroup', 'update');
				return userGroupBLL.update(
					userGroup,
					parseInt(req.params.groupid)
				).then(function(result) {
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
			function(req, res, next) {
				return userGroupBLL.delete( parseInt(req.params.groupid) ).then(function() {
					res.routeHelper.renderInfo(res, {
						message: '已删除指定用户组'
					});
				});
			}
		)
	)
};