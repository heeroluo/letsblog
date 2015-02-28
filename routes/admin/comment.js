/*!
 * LetsBlog
 * Routes of comment management pages (2015-02-28T17:27:03+0800)
 * Released under MIT license
 */

'use strict';

var util = require('../../lib/util'),
	commentBLL = require('../../bll/comment');


// 基本权限检查
function addPermissionChecking(handler) {
	return function(req, res, next) {
		if (req.currentUser.group.perm_comment) {
			handler.apply(this, arguments);
		} else {
			next( util.createError('权限不足', 403) );
		}
	};
}


exports.list = addPermissionChecking(function(req, res, next) {
	var params = {
			state: req.query.state ? parseInt(req.query.state) : null
		},
		page = parseInt(req.query.page) || -1;

	commentBLL.list(params, 20, page, function(err, result) {
		if (!err) {
			if (result.data) {
				result.data.forEach(function(d) {
					d.pubtime_formatted = d.pubtime.getFullYear() + '-' +
						(d.pubtime.getMonth() + 1) + '-' +
						d.pubtime.getDate() + ' ' +
						d.pubtime.getHours() + ':' + 
						d.pubtime.getMinutes() + ':' +
						d.pubtime.getSeconds();
				});
				res.routeHandler.setData('commentList', result.data);
			}

			var hrefTpl = util.toQueryString(params);
			if (hrefTpl) {
				hrefTpl = '?' + hrefTpl + '&amp;';
			} else {
				hrefTpl = '?';
			}
			hrefTpl += 'page={{page}}';

			res.routeHandler.setData('params', params);

			// 分页条
			if (result.totalPages > 1) {
				res.routeHandler.setData('paginator', util.createPaginatorData(
					result.page, result.totalPages, hrefTpl
				));
			}
		}
		next(err);
	});
});


exports.batch_post = addPermissionChecking(function(req, res, next) {
	var commentids = util.convert(req.body.commentids, 'array<int>');

	switch (req.body.action){
		case 'approve':
			commentBLL.updateState(1, commentids, function(err) {
				if (err) {
					next(err);
				} else {
					res.routeHandler.renderInfo(res, {
						message: '已审核指定评论'
					});
				}
			});
			break;

		case 'delete':
			commentBLL.deleteByCommentIds(commentids, function(err, result) {
				if (err) {
					next(err);
				} else {
					res.routeHandler.renderInfo(res, {
						message: '已删除指定评论'
					});
				}
			});
			break;

		default:
			res.end();
	}
});


exports.getTotalPendingReviews = addPermissionChecking(function(req, res, next) {
	commentBLL.getTotalPendingReviews(function(err, result) {
		if (!err) {
			res.routeHandler.setData('total', result);
		}
		next(err);
	});
});