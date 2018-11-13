/*!
 * LetsBlog
 * Routes of comment management pages
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const pageType = require('../../page-type');
const commentBLL = require('../../../bll/comment');


// 基本权限检查
function checkPermission(req) {
	if (!req.currentUser.usergroup.perm_comment) {
		return util.createError('权限不足', 403);
	}
}


// 评论列表
exports.list = pageType.admin(
	pageType.prepend(
		checkPermission,
		(req, res) => {
			const params = {
				state: req.query.state ? parseInt(req.query.state) : null
			};
			const page = parseInt(req.query.page) || -1;

			return commentBLL.list(params, 20, page).then((result) => {
				res.routeHelper.viewData({
					commentList: result,
					params
				});
			});
		}
	)
);


// 批量操作（删除或审核）
exports['list/batch'] = {
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				const commentids = util.convert(req.body.commentids, 'array<int>');
				let promise;
				switch (req.body.action) {
					case 'approve':
						promise = commentBLL.updateState(1, commentids).then(() => {
							res.routeHelper.renderInfo(res, {
								message: '已审核指定评论'
							});
						});
						break;

					case 'delete':
						promise = commentBLL.deleteByCommentIds(commentids).then(() => {
							res.routeHelper.renderInfo(res, {
								message: '已删除指定评论'
							});
						});
						break;
				}

				if (promise) {
					return promise;
				} else {
					res.routeHelper.renderInfo(res, {
						status: 2,
						message: '未知的操作'
					});
				}
			}
		)
	)
};


// 获取未审核评论数
exports.totalpendingreviews = {
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				return commentBLL.getTotalPendingReviews().then((result) => {
					res.routeHelper.viewData('total', result);
				});
			}
		)
	)
};