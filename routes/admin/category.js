/*!
 * LetsBlog
 * Routes of category management pages (2015-02-17T17:47:31+0800)
 * Released under MIT license
 */

'use strict';

var async = require('async'),
	util = require('../../lib/util'),
	userGroupBLL = require('../../bll/usergroup'),
	categoryModel = require('../../entity/category'),
	categoryBLL = require('../../bll/category');


// 权限验证
function addPermissionChecking(handler) {
	return function(req, res, next) {
		if (req.currentUser.group.perm_manage_article < 2) {
			next( util.createError('权限不足', 403) );
		} else {
			handler.apply(this, arguments);
		}
	};
}


exports.create = addPermissionChecking(function(req, res, next) {
	userGroupBLL.list(function(err, result) {
		if (!err) {
			var category = categoryModel.createEntity();
			category.weight = '';
			res.routeHandler.setData('category', category);
			res.routeHandler.setData('userGroupList', result);
		}
		next(err);
	});
});

exports.create_post = addPermissionChecking(function(req, res, next)  {
	var category = req.getEntity('category', 'insert');
	categoryBLL.create(category, function(err, result) {
		if (err) {
			next(err);
		} else {
			res.routeHandler.renderInfo(res, {
				message: '已创建新分类 ' + category.categoryname
			});
		}
	});
});


exports.update = addPermissionChecking(function(req, res, next) {
	var categoryid = parseInt(req.params.categoryid);
	async.parallel([function(callback) {
		categoryBLL.read(categoryid, function(err, result) {
			if (!err) {
				if (result) {
					res.routeHandler.setData('category', result);
				} else {
					err = util.createError('分类不存在', 404);
				}
			}
			callback(err);
		});
	}, function(callback) {
		userGroupBLL.list(function(err, result) {
			res.routeHandler.setData('userGroupList', result);
			callback(err);
		});
	}], next);
});

exports.update_post = addPermissionChecking(function(req, res, next) {
	var categoryid = parseInt(req.params.categoryid),
		category = req.getEntity('category', 'update');

	categoryBLL.update(category, categoryid, function(err) {
		if (err) {
			next(err);
		} else {
			res.routeHandler.renderInfo(res, {
				message: '已更新分类 ' + category.categoryname
			});
		}
	});
});


exports.list = addPermissionChecking(function(req, res, next) {
	async.parallel([function(callback) {
		categoryBLL.list(function(err, result) {
			res.routeHandler.setData('categoryList', result);
			callback(err);
		});
	}, function(callback) {
		userGroupBLL.list(function(err, result) {
			res.routeHandler.setData('userGroupMap', result);
			callback(err);
		}, 1);
	}], next);
});


exports.delete_post = addPermissionChecking(function(req, res, next) {
	var categoryid = parseInt(req.params.categoryid);
	categoryBLL.delete(categoryid, function(err) {
		if (err) {
			next(err);
		} else {
			res.routeHandler.renderInfo(res, {
				message: '已删除指定分类'
			});
		}
	});
});