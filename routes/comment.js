/*!
 * LetsBlog
 * Routes of comment (2015-02-23T18:25:28+0800)
 * Released under MIT license
 */

'use strict';

var async = require('async'),
	util = require('../lib/util'),
	commentBLL = require('../bll/comment');


function getCommentList(articleid, page, res, callback) {
	var params = {
		articleid: articleid,
		state: 1
	};

	commentBLL.list(params, 10, page, function(err, result) {
		if (result) {
			if (result.data) {
				result.data = result.data.map(function(c) {
					c = c.toPureData();
					c.pubtime_formatted = util.formatDateFromNow(c.pubtime);
					// 删除较为敏感的数据
					delete c.user_email;
					delete c.user_qq;
					delete c.ip;

					return c;
				});
			}
			res.routeHandler.setData('commentList', result.data);
			res.routeHandler.setData('totalPages', result.totalPages);
			res.routeHandler.setData('totalRows', result.totalRows);
			res.routeHandler.setData('page', result.page);
		}
		callback(err);
	});
}


exports.create = function(req, res, next) {
	var comment = req.getEntity('comment', 'insert');
	comment.pubtime = new Date();
	comment.ip = req.ip;

	async.series([function(callback) {
		commentBLL.create(comment, req.currentUser, function(err, result) {
			if (!err) {
				comment.commentid = result.insertId;
				res.routeHandler.setData('lastComment', comment.toPureData());
			}
			callback(err);
		});
	}, function(callback) {
		getCommentList(comment.articleid, -1, res, callback);
	}], next);
};


exports.list = function(req, res, next) {
	getCommentList(
		parseInt(req.params.articleid),
		parseInt(req.query.page),
		res,
		next
	);
};