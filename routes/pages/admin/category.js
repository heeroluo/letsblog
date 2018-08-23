/*!
 * LetsBlog
 * Routes of category management pages
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const pageType = require('../../page-type');
const userGroupBLL = require('../../../bll/usergroup');
const categoryModel = require('../../../entity/category');
const categoryBLL = require('../../../bll/category');


// 创建权限验证函数
function checkPermission(req) {
	if (req.currentUser.group.perm_manage_article < 2) {
		return util.createError('权限不足', 403);
	}
}


// 创建分类界面
exports.create = {
	template: 'admin/category__form/category__form',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				const category = categoryModel.createEntity();
				category.weight = '';
				res.routeHelper.viewData('category', category);

				return userGroupBLL.list().then((result) => {
					res.routeHelper.viewData('userGroupList', result);
				});
			}
		)
	)
};

// 提交新分类
exports['create/post'] = {
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				const category = req.getEntity('category', 'insert');
				return categoryBLL.create(category).then(() => {
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
	template: 'admin/category__form/category__form',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				return Promise.all([
					categoryBLL.read(parseInt(req.params.categoryid)).then((result) => {
						if (result) {
							res.routeHelper.viewData('category', result);
						} else {
							return util.createError('分类不存在', 404);
						}
					}),
					userGroupBLL.list().then((result) => {
						res.routeHelper.viewData('userGroupList', result);
					})
				]);
			}
		)
	)
};

// 提交分类修改
exports['update/post'] = {
	pathPattern: '/category/update/:categoryid/post',
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				const category = req.getEntity('category', 'update');
				return categoryBLL.update(
					category, parseInt(req.params.categoryid)
				).then(() => {
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
		(req, res) => {
			return Promise.all([
				categoryBLL.list().then((result) => {
					res.routeHelper.viewData('categoryList', result);
				}),
				userGroupBLL.list(1).then((result) => {
					res.routeHelper.viewData('userGroupMap', result);
				})
			]);
		}
	)
);


// 删除分类
exports['delete/post'] = {
	pathPattern: '/category/delete/:categoryid/post',
	verb: 'post',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				return categoryBLL.delete(
					parseInt(req.params.categoryid)
				).then(() => {
					res.routeHelper.renderInfo(res, {
						message: '已删除指定分类'
					});
				});
			}
		)
	)
};