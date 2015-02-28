/*!
 * LetsBlog
 * Routes of link management pages (2015-02-25T11:24:16+0800)
 * Released under MIT license
 */

'use strict';

var util = require('../../lib/util'),
	linkBLL = require('../../bll/link'),
	linkModel = require('../../entity/link');


// 权限验证
function addPermissionChecking(handler) {
	return function(req, res, next) {
		if (!req.currentUser.group.perm_manage_option) {
			next(util.createError('权限不足', 403));
		} else {
			handler.apply(this, arguments);
		}
	};
}


exports.create = addPermissionChecking(function(req, res, next) {
	var link = linkModel.createEntity();
	link.weight = '';
	res.routeHandler.setData('link', link);
	next();
});

exports.create_post = addPermissionChecking(function(req, res, next) {
	var link = req.getEntity('link', 'insert');
	linkBLL.create(link, function(err) {
		if (err) {
			next(err);
		} else {
			res.routeHandler.renderInfo(res, {
				message: '已创建新链接 ' + link.linkname
			});
		}
	});
});


exports.update = addPermissionChecking(function(req, res, next) {
	var linkid = parseInt(req.params.linkid);
	linkBLL.read(linkid, function(err, result) {
		if (!err) {
			if (result == null) {
				err = util.createError('链接不存在', 404);
			} else {
				res.routeHandler.setData('link', result);
			}
		}
		next(err);
	});
});

exports.update_post = addPermissionChecking(function(req, res, next) {
	var linkid = parseInt(req.params.linkid),
		link = req.getEntity('link', 'update');

	linkBLL.update(link, linkid, function(err) {
		if (err) {
			next(err);
		} else {
			res.routeHandler.renderInfo(res, {
				message: '已更新链接 ' + link.linkname
			});
		}
	});
});


exports.list = addPermissionChecking(function(req, res, next) {
	linkBLL.list(function(err, result) {
		if (!err) {
			res.routeHandler.setData('linkList', result);
		}
		next(err);
	});
});


exports.delete_post = addPermissionChecking(function(req, res, next) {
	var linkid = parseInt(req.params.linkid);
	linkBLL.delete(linkid, function(err) {
		if (err) {
			next(err);
		} else {
			res.routeHandler.renderInfo(res, {
				message: '已删除指定链接'
			});
		}
	});
});