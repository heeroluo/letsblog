/*!
 * LetsBlog
 * Routes of link management pages
 * Released under MIT license
 */

'use strict';

var util = require('../../../lib/util'),
	pageType = require('../../page-type'),
	linkBLL = require('../../../bll/link'),
	linkModel = require('../../../entity/link');


// 权限验证
function checkPermission(req, res, next) {
	if (!req.currentUser.group.perm_manage_option) {
		return util.createError('权限不足', 403);
	}
	next();
}


// 创建链接界面
exports.create = {
	template: 'admin/link__form',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res, next) {
				var link = linkModel.createEntity();
				link.weight = '';
				res.routeHelper.viewData('link', link);
				next();
			}
		)
	)
};

// 提交新链接
exports['create/post'] = {
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res, next) {
				var link = req.getEntity('link', 'insert');
				return linkBLL.create(link).then(function() {
					res.routeHelper.renderInfo(res, {
						message: '已创建新链接 ' + link.linkname
					});
				});
			}
		)
	)
};


// 修改链接界面
exports.update = {
	pathPattern: '/link/update/:linkid',
	template: 'admin/link__form',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res, next) {
				return linkBLL.read( parseInt(req.params.linkid) ).then(function(result) {
					if (result == null) {
						throw util.createError('链接不存在', 404);
					} else {
						res.routeHelper.viewData('link', result);
					}
				});
			}
		)
	)
};

// 提交链接修改
exports['update/post'] = {
	pathPattern: '/link/update/:linkid/post',
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res, next) {
				var link = req.getEntity('link', 'update');
				return linkBLL.update( link, parseInt(req.params.linkid) ).then(function() {
					res.routeHelper.renderInfo(res, {
						message: '已更新链接 ' + link.linkname
					});
				});
			}
		)
	)
};


// 链接列表
exports.list = pageType.admin(
	pageType.prepend(
		checkPermission,
		function(req, res, next) {
			return linkBLL.list().then(function(result) {
				res.routeHelper.viewData('linkList', result);
			});
		}
	)
);


// 删除链接
exports.delete__post = {
	pathPattern: '/link/delete/:linkid/post',
	resType: 'json',
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res, next) {
				return linkBLL.delete( parseInt(req.params.linkid) ).then(function() {
					res.routeHelper.renderInfo(res, {
						message: '已删除指定链接'
					});
				});
			}
		)
	)
};