/*!
 * LetsBlog
 * Routes of link management pages
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const pageType = require('../../page-type');
const linkBLL = require('../../../bll/link');


// 权限验证
function checkPermission(req) {
	if (!req.currentUser.usergroup.perm_manage_option) {
		return util.createError('权限不足', 403);
	}
}


// 链接列表
exports.list = {
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			async(req, res) => {
				res.routeHelper.viewData('linkList', await linkBLL.list());
			}
		)
	)
};


// 加载单条链接数据
exports.read = {
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			async(req, res) => {
				res.routeHelper.viewData(
					'link',
					await linkBLL.read(parseInt(req.query.id))
				);
			}
		)
	)
};



// 提交新链接
exports.create = {
	verb: 'post',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			async(req) => {
				const link = req.getModel('link', req.body);
				await linkBLL.create(link);
			}
		)
	)
};


// 提交链接修改
exports.update = {
	verb: 'put',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			async(req) => {
				const link = req.getModel('link', req.body);
				await linkBLL.update(link, link.linkid);
			}
		)
	)
};


// 删除链接
exports['delete'] = {
	resType: 'json',
	verb: 'delete',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			async(req) => {
				await linkBLL.delete(parseInt(req.query.id));
			}
		)
	)
};