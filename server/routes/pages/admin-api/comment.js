/*!
 * LetsBlog
 * JSON APIs of comment management
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const commentBLL = require('../../../bll/comment');


// 基本权限检查
function checkPermission(req) {
	if (!req.currentUser.usergroup.perm_comment) {
		return util.createError('权限不足', 403);
	}
}


// 评论列表
exports.list = [
	checkPermission,
	async(req, res) => {
		const page = parseInt(req.query.page) || -1;
		const params = {
			state: req.query.state ? parseInt(req.query.state) : null
		};

		const result = await commentBLL.list(20, page, params);
		res.routeHelper.viewData({
			pageCount: result.pageCount,
			page: result.page,
			rows: result.rows
		});
	}
];


// 批量操作（删除或审核）
exports['list/batch'] = {
	verb: 'post',
	callbacks: [
		checkPermission,
		async(req) => {
			const commentids = req.body.commentids;
			switch (req.body.action) {
				case 'audit':
					await commentBLL.updateState(1, commentids);
					break;

				case 'delete':
					await commentBLL.deleteByCommentIds(commentids);
					break;
			}
		}
	]
};


// 获取未审核评论数
exports.totalpendingreviews = [
	checkPermission,
	async(req, res) => {
		res.routeHelper.viewData('total', await commentBLL.getTotalPendingReviews());
	}
];