/*!
 * LetsBlog
 * Routes of link management pages
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const pageType = require('../../page-type');
const linkBLL = require('../../../bll/link');
const linkModel = require('../../../entity/link');


// 权限验证
function checkPermission(req) {
	if (!req.currentUser.group.perm_manage_option) {
		return util.createError('权限不足', 403);
	}
}


// 创建链接界面
exports.create = {
	template: 'admin/link__form/link__form',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				const link = linkModel.createEntity();
				link.weight = '';
				res.routeHelper.viewData('link', link);
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
			(req, res) => {
				const link = req.getEntity('link', 'insert');
				return linkBLL.create(link).then(() => {
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
	template: 'admin/link__form/link__form',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				return linkBLL.read(parseInt(req.params.linkid)).then((result) => {
					if (result == null) {
						return util.createError('链接不存在', 404);
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
			(req, res) => {
				const link = req.getEntity('link', 'update');
				return linkBLL.update(link, parseInt(req.params.linkid)).then(() => {
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
		(req, res) => {
			return linkBLL.list().then((result) => {
				res.routeHelper.viewData('linkList', result);
			});
		}
	)
);


// 删除链接
exports['delete/post'] = {
	pathPattern: '/link/delete/:linkid/post',
	resType: 'json',
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				return linkBLL.delete(parseInt(req.params.linkid)).then(() => {
					res.routeHelper.renderInfo(res, {
						message: '已删除指定链接'
					});
				});
			}
		)
	)
};