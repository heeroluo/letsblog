/*!
 * LetsBlog
 * Routes of comment management pages
 * Released under MIT license
 */

'use strict';

var Promise = require('bluebird'),
	util = require('../../../lib/util'),
	pageType = require('../../page-type'),
	commentBLL = require('../../../bll/comment');


// 基本权限检查
function checkPermission(req, res, next) {
	if (!req.currentUser.group.perm_comment) {
		return util.createError('权限不足', 403);
	}
	next();
}


// 评论列表
exports.list = pageType.admin(
	pageType.prepend(
		checkPermission,
		function(req, res, next) {
			var params = {
					state: req.query.state ? parseInt(req.query.state) : null
				},
				page = parseInt(req.query.page) || -1;

			return commentBLL.list(params, 20, page).then(function(result) {				
				res.routeHelper.viewData({
					commentList: result,
					params: params
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
			function(req, res, next) {
				var commentids = util.convert(req.body.commentids, 'array<int>'), promise;
				switch (req.body.action) {
					case 'approve':
						promise = commentBLL.updateState(1, commentids).then(function() {
							res.routeHelper.renderInfo(res, {
								message: '已审核指定评论'
							});
						});
					break;

					case 'delete':
						promise = commentBLL.deleteByCommentIds(commentids).then(function() {
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
			function(req, res, next) {
				return commentBLL.getTotalPendingReviews(function(result) {
					res.routeHelper.viewData('total', result);
				});
			}
		)
	)
};