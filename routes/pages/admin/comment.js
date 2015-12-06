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
	var err;
	if (!req.currentUser.group.perm_comment) {
		err = util.createError('权限不足', 403);
	}
	next(err);
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
				result.data.forEach(function(d) {
					d.pubtime_formatted = d.pubtime.getFullYear() + '-' +
						(d.pubtime.getMonth() + 1) + '-' +
						d.pubtime.getDate() + ' ' +
						d.pubtime.getHours() + ':' + 
						d.pubtime.getMinutes() + ':' +
						d.pubtime.getSeconds();
				});
				res.routeHelper.viewData('commentList', result.data);

				var hrefTpl = util.toQueryString(params);
				if (hrefTpl) {
					hrefTpl = '?' + hrefTpl + '&amp;';
				} else {
					hrefTpl = '?';
				}
				hrefTpl += 'page={{page}}';

				res.routeHelper.viewData('params', params);

				// 分页条
				if (result.totalPages > 1) {
					res.routeHelper.viewData(
						'paginator',
						util.createPaginatorData( result.page, result.totalPages, hrefTpl )
					);
				}
			});
		}
	)
);


// 批量操作（删除或审核）
exports.list__batch = {
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