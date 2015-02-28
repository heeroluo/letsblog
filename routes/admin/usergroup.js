/*!
 * LetsBlog
 * Routes of usergroup management pages (2015-02-17T17:46:16+0800)
 * Released under MIT license
 */

'use strict';

var util = require('../../lib/util'),
	userGroupModel = require('../../entity/usergroup'),
	userGroupBLL = require('../../bll/usergroup');


// 权限验证
function addPermissionChecking(handler) {
	return function(req, res, next) {
		if (req.currentUser.group.perm_manage_user < 2) {
			next(util.createError('权限不足', 403));
		} else {
			handler.apply(this, arguments);
		}
	};
}


exports.list = addPermissionChecking(function(req, res, next) {
	userGroupBLL.list(function(err, result) {
		if (!err) {
			res.routeHandler.setData('userGroupList', result);
		}
		next(err);
	});
});


exports.create = addPermissionChecking(function(req, res, next) {
	res.routeHandler.setData('userGroup', userGroupModel.createEntity());
	next();
});

exports.create_post = addPermissionChecking(function(req, res, next) {
	var userGroup = req.getEntity('usergroup', 'insert');
	userGroupBLL.create(userGroup, function(err, result) {
		if (err) {
			next(err);
		} else {
			res.routeHandler.renderInfo(res, {
				message: '已创建新用户组 ' + userGroup.groupname
			});
		}
	});
});


exports.update = addPermissionChecking(function(req, res, next) {
	var groupid = parseInt(req.params.groupid);
	userGroupBLL.read(groupid, function(err, result) {
		if (!err) {
			if (result) {
				res.routeHandler.setData('userGroup', result);
			} else {
				err = util.createError('用户组不存在', 404);
			}
		}
		next(err);
	});
});

exports.update_post = addPermissionChecking(function(req, res, next) {
	var groupid = parseInt(req.params.groupid),
		userGroup = req.getEntity('usergroup', 'update');

	userGroupBLL.update(userGroup, groupid, function(err, result) {
		if (err) {
			next(err);
		} else {
			res.routeHandler.renderInfo(res, {
				message: '已更新用户组 ' + userGroup.groupname
			});
		}
	});
});


exports.delete_post = addPermissionChecking(function(req, res, next) {
	var groupid = parseInt(req.params.groupid);
	userGroupBLL.delete(groupid, function(err, result) {
		if (err) {
			next(err);
		} else {
			res.routeHandler.renderInfo(res, {
				message: '已删除指定用户组'
			});
		}
	});
});