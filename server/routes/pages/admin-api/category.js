/*!
 * LetsBlog
 * JSON APIs of category management
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const categoryBLL = require('../../../bll/category');


// 创建权限验证函数
function checkPermission(req) {
	if (req.currentUser.usergroup.perm_manage_article < 2) {
		throw util.createError('权限不足', 403);
	}
}


// 分类列表
exports.list = [
	checkPermission,
	async(req, res) => {
		res.routeHelper.viewData('categoryList', await categoryBLL.list());
	}
];


// 加载单个分类数据
exports.read = [
	checkPermission,
	async(req, res) => {
		res.routeHelper.viewData(
			'category',
			await categoryBLL.read(parseInt(req.query.id))
		);
	}
];


// 提交新分类
exports.create = {
	verb: 'post',
	callbacks: [
		checkPermission,
		async(req) => {
			const category = req.getModel('category');
			await categoryBLL.create(category);
		}
	]
};


// 提交分类修改
exports.update = {
	verb: 'put',
	callbacks: [
		checkPermission,
		async(req) => {
			const category = req.getModel('category');
			await categoryBLL.update(category, category.categoryid);
		}
	]
};


// 删除分类
exports['delete'] = {
	verb: 'delete',
	callbacks: [
		checkPermission,
		async(req) => {
			await categoryBLL.delete(parseInt(req.query.id));
		}
	]
};