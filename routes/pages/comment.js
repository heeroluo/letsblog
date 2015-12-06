/*!
 * LetsBlog
 * Routes of comment
 * Released under MIT license
 */

'use strict';

var Promise = require('bluebird'),
	util = require('../../lib/util'),
	pageType = require('../page-type'),
	commentBLL = require('../../bll/comment');


// 列表页及发表评论后都要加载列表数据
// 把这个过程写成函数
function getCommentList(articleid, page, res) {
	var params = {
		articleid: articleid,
		state: 1
	};

	return commentBLL.list(params, 10, page).then(function(result) {
		result.data = result.data.map(function(c) {
			c = c.toPureData();
			c.pubtime_formatted = util.formatDateFromNow(c.pubtime);
			// 删除较为敏感的数据
			delete c.user_email;
			delete c.user_qq;
			delete c.ip;

			return c;
		});
		res.routeHelper.viewData('commentList', result.data);
		res.routeHelper.viewData('totalPages', result.totalPages);
		res.routeHelper.viewData('totalRows', result.totalRows);
		res.routeHelper.viewData('page', result.page);
	});
}


// 发表评论
exports.create = {
	verb: 'post',
	resType: 'json',
	callbacks: pageType.normal(function(req, res, next) {
		var comment = req.getEntity('comment', 'insert');
		comment.pubtime = new Date();
		comment.ip = req.ip;

		return commentBLL.create(comment, req.currentUser).then(function(result) {
			comment.commentid = result.insertId;
			res.routeHelper.viewData( 'lastComment', comment.toPureData() );
		}).then(function() {
			return getCommentList(comment.articleid, -1, res);
		});
	})
};


// 评论列表（JSON数据）
exports.list = {
	pathPattern: '/list/:articleid',
	resType: 'json',
	callbacks: pageType.normal(function(req, res, next) {
		return getCommentList(
			parseInt(req.params.articleid),
			parseInt(req.query.page),
			res
		);
	})
};