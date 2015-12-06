/*!
 * LetsBlog
 * Routes of category management pages
 * Released under MIT license
 */

'use strict';

var Promise = require('bluebird'),
	util = require('../../../lib/util'),
	pageType = require('../../page-type'),
	userGroupBLL = require('../../../bll/usergroup'),
	categoryModel = require('../../../entity/category'),
	categoryBLL = require('../../../bll/category');


// 创建权限验证函数
function checkPermission(req, res, next) {
	var err;
	if (req.currentUser.group.perm_manage_article < 2) {
		err = util.createError('权限不足', 403);
	}
	next(err);
}


// 创建分类界面
exports.create = {
	template: 'admin/category-form',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res, next) {
				var category = categoryModel.createEntity();
				category.weight = '';
				res.routeHelper.viewData('category', category);

				return userGroupBLL.list().then(function(result) {
					res.routeHelper.viewData('userGroupList', result);
				});
			}
		)
	)
};

// 提交新分类
exports.create__post = {
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res, next) {
				var category = req.getEntity('category', 'insert');
				return categoryBLL.create(category).then(function() {
					res.routeHelper.renderInfo(res, {
						message: '已创建新分类 ' + category.categoryname
					});
				});
			}
		)
	)
};


// 修改分类界面
exports.update = {
	pathPattern: '/category/update/:categoryid',
	template: 'admin/category-form',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res, next) {
				return Promise.all([
					categoryBLL.read( parseInt(req.params.categoryid) ).then(function(result) {
						if (result) {
							res.routeHelper.viewData('category', result);
						} else {
							throw util.createError('分类不存在', 404);
						}
					}),
					userGroupBLL.list().then(function(result) {
						res.routeHelper.viewData('userGroupList', result);
					})
				]);
			}
		)
	)
};

// 提交分类修改
exports.update__post = {
	pathPattern: '/category/update/:categoryid/post',
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res, next) {
				var category = req.getEntity('category', 'update');
				return categoryBLL.update( category, parseInt(req.params.categoryid) ).then(function() {
					res.routeHelper.renderInfo(res, {
						message: '已更新分类 ' + category.categoryname
					});
				});
			}
		)
	)
};


// 分类列表
exports.list = pageType.admin(
	pageType.prepend(
		checkPermission,
		function(req, res, next) {
			return Promise.all([
				categoryBLL.list().then(function(result) {
					res.routeHelper.viewData('categoryList', result);
				}),
				userGroupBLL.list(1).then(function(result) {
					res.routeHelper.viewData('userGroupMap', result);
				})
			]);
		}
	)
);


// 删除分类
exports.delete__post = {
	pathPattern: '/category/delete/:categoryid/post',
	verb: 'post',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res, next) {
				return categoryBLL.delete( parseInt(req.params.categoryid) ).then(function() {
					res.routeHelper.renderInfo(res, {
						message: '已删除指定分类'
					});
				});
			}
		)
	)
};