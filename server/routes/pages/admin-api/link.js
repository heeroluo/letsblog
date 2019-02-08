/*!
 * LetsBlog
 * JSON APIs of link management
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const linkBLL = require('../../../bll/link');


// 权限验证
function checkPermission(req) {
	if (!req.currentUser.usergroup.perm_manage_option) {
		return util.createError('权限不足', 403);
	}
}


// 链接列表
exports.list = [
	checkPermission,
	async(req, res) => {
		res.routeHelper.viewData('linkList', await linkBLL.list());
	}
];


// 加载单条链接数据
exports.read = [
	checkPermission,
	async(req, res) => {
		res.routeHelper.viewData(
			'link',
			await linkBLL.read(parseInt(req.query.id))
		);
	}
];


// 提交新链接
exports.create = {
	verb: 'post',
	callbacks: [
		checkPermission,
		async(req) => {
			const link = req.getModel('link');
			await linkBLL.create(link);
		}
	]
};


// 提交链接修改
exports.update = {
	verb: 'put',
	callbacks: [
		checkPermission,
		async(req) => {
			const link = req.getModel('link');
			await linkBLL.update(link, link.linkid);
		}
	]
};


// 删除链接
exports['delete'] = {
	verb: 'delete',
	callbacks: [
		checkPermission,
		async(req) => {
			await linkBLL.delete(parseInt(req.query.id));
		}
	]
};