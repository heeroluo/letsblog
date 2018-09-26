/*!
 * LetsBlog
 * Routes of comment
 * Released under MIT license
 */

'use strict';

const pageType = require('../page-type');
const commentBLL = require('../../bll/comment');


// 列表页及发表评论后都要加载列表数据
// 把这个过程写成函数
function getCommentList(articleid, page, res) {
	const params = {
		articleid: articleid,
		state: 1
	};

	return commentBLL.list(params, 5, page).then((result) => {
		result.data = result.data.map((c) => {
			c = c.toPureData();
			// 日期转成数字
			c.pubtime = c.pubtime.getTime();

			// 删除较为敏感的数据
			delete c.user_email;
			delete c.user_qq;
			delete c.ip;

			return c;
		});
		res.routeHelper.viewData({
			commentList: result.data,
			totalPages: result.totalPages,
			totalRows: result.totalRows,
			page: result.page
		});
	});
}


// 发表评论
exports.create = {
	verb: 'post',
	resType: 'json',
	callbacks: pageType.normal((req, res) => {
		const comment = req.getEntity('comment', 'insert');
		comment.pubtime = new Date();
		comment.ip = req.ip;

		return commentBLL.create(comment, req.currentUser).then((result) => {
			comment.commentid = result.insertId;
			res.routeHelper.viewData('lastComment', comment.toPureData());
		}).then(() => {
			return getCommentList(comment.articleid, -1, res);
		});
	})
};


// 评论列表（JSON数据）
exports.list = {
	pathPattern: '/list/:articleid',
	resType: 'json',
	callbacks: pageType.normal((req, res) => {
		return getCommentList(
			parseInt(req.params.articleid),
			parseInt(req.query.page),
			res
		);
	})
};