/*!
 * LetsBlog
 * 评论相关前台路由
 * Released under MIT license
 */

'use strict';

const pageType = require('../page-type');
const commentBLL = require('../../bll/comment');


// 列表页及发表评论后都要加载列表数据
// 把这个过程写成函数
async function getCommentList(articleid, page, res) {
	const params = {
		articleid: articleid,
		state: 1
	};

	const result = await commentBLL.list(10, page, params);

	result.rows.forEach((c) => {
		// 日期转成数字
		c.pubtime = c.pubtime.getTime();

		// 删除较为敏感的数据
		delete c.user_email;
		delete c.user_qq;
		delete c.ip;

		return c;
	});

	res.routeHelper.viewData({
		commentList: result.rows,
		totalPages: result.pageCount,
		totalRows: result.rowCount,
		page: result.page
	});
}


// 发表评论
exports.create = {
	verb: 'post',
	resType: 'json',
	callbacks: pageType.normal(async(req, res) => {
		let comment = req.getModel('comment');
		comment.pubtime = new Date();
		comment.ip = req.ip;

		comment = await commentBLL.create(comment, req.currentUser);
		res.routeHelper.viewData('lastComment', comment);

		await getCommentList(comment.articleid, -1, res);
	})
};


// 评论列表（JSON数据）
exports.list = {
	pathPattern: '/list/:articleid',
	resType: 'json',
	callbacks: pageType.normal(async(req, res) => {
		await getCommentList(
			parseInt(req.params.articleid),
			parseInt(req.query.page),
			res
		);
	})
};