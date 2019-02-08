/*!
 * LetsBlog
 * JSON APIs of article management
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const articleBLL = require('../../../bll/article');
const appConfig = require('../../../../config');


// 基本权限验证
function checkPermission(req) {
	// 检查发文章权限和文章管理权限
	const usergroup = req.currentUser.usergroup;
	if (!usergroup.perm_article && !usergroup.perm_manage_article) {
		return util.createError('权限不足', 403);
	}
}


// 加载单篇文章数据
exports.read = [
	checkPermission,
	async(req, res) => {
		res.routeHelper.viewData(
			'article',
			await articleBLL.read(req.query.id)
		);
	}
];


// 提交新文章
exports.create = {
	verb: 'post',
	callbacks: [
		checkPermission,
		async(req, res) => {
			const article = req.getModel('article');
			article.pubtime = new Date();

			// 返回文章编号，以便后续编辑
			const result = await articleBLL.create(article, req.currentUser);
			res.routeHelper.viewData('articleid', result.articleid);
		}
	]
};


// 提交文章修改
exports.update = {
	verb: 'put',
	callbacks: [
		checkPermission,
		async(req) => {
			// 提交格式 { article: { ... }, updatePubTime: true | false }

			if (!req.body.article) {
				throw util.createError('数据格式错误', 400);
			}

			const newArticle = req.getModel('article', req.body.article);
			const article = await articleBLL.read(newArticle.articleid);

			if (!article) {
				throw util.createError('文章不存在', 400);
			}
			// 没有文章管理权限的用户，不能编辑他人文章
			if (!req.currentUser.usergroup.perm_manage_article &&
				req.currentUser.userid != article.userid
			) {
				throw util.createError('权限不足', 403);
			}

			newArticle.pubtime = req.body.updatePubTime ? new Date() : article.pubtime;

			await articleBLL.update(newArticle, newArticle.articleid, req.currentUser);
		}
	]
};


// 文章列表
exports.list = [
	checkPermission,
	async(req, res) => {
		// 没有管理权限的用户只能看到自己的文章
		const isPersonalPage =
			req.query.type == 'personal' ||
			!req.currentUser.usergroup.perm_manage_article;

		const page = parseInt(req.query.page) || 1;
		const params = isPersonalPage ? {
			userid: req.currentUser.userid
		} : {
			minWeight: parseInt(req.query.min_weight) || null,
			maxWeight: parseInt(req.query.max_weight) || null,
			categoryid: parseInt(req.query.categoryid) || null,
			state: parseInt(req.query.state) || null,
			username: req.query.username || '',
			title: req.query.title || ''
		};

		const result = await articleBLL.list(15, page, params);
		res.routeHelper.viewData({
			pageCount: result.pageCount,
			page: result.page,
			rows: result.rows
		});
	}
];


// 批量删除文章
exports['list/batch'] = {
	verb: 'post',
	callbacks: [
		checkPermission,
		async(req) => {
			const currentUser = req.currentUser;
			// 非管理员只能删自己的文章
			await articleBLL.delete(
				req.body.articleids,
				currentUser.usergroup.perm_manage_article ? 0 : currentUser.userid
			);
		}
	]
};


// 文件上传支持
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
	destination(req, file, callback) {
		function callCallback(err, targetDir, localDir) {
			if (targetDir) {
				req.res.routeHelper.viewData('path', '/upload/' + targetDir);
			}
			callback(err, localDir);
		}

		const now = new Date();
		const targetDir = 'article/' +
			now.getFullYear() + ('0' + (now.getMonth() + 1)).slice(-2);
		const localDir = path.join(appConfig.uploadDir, targetDir);

		// 创建年月目录
		fs.exists(localDir, (exists) => {
			if (exists) {
				callCallback(null, targetDir, localDir);
			} else {
				fs.mkdir(localDir, (err) => {
					if (err) {
						callCallback(err);
					} else {
						callCallback(null, targetDir, localDir);
					}
				});
			}
		});
	},

	filename(req, file, callback) {
		const now = new Date();

		// 重命名为 年+月+日+时+分+秒+5位随机数
		const fileName = now.getFullYear() +
			('0' + (now.getMonth() + 1)).slice(-2) +
			('0' + (now.getDate() + 1)).slice(-2) +
			('0' + (now.getHours() + 1)).slice(-2) +
			('0' + (now.getMinutes() + 1)).slice(-2) +
			('0' + (now.getSeconds() + 1)).slice(-2) +
			parseInt(10000 + Math.random() * 90000) +
			path.extname(file.originalname);

		const res = req.res;
		res.routeHelper.viewData(
			'path',
			res.routeHelper.viewData('path') + '/' + fileName
		);

		callback(null, fileName);
	}
});

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 5 * 1024 * 1024
	}
}).single('file');

exports['attachment/upload'] = {
	verb: 'post',
	callbacks: [
		checkPermission,
		(req, res, next) => {
			upload(req, res, (err) => {
				next(err);
			});
			return true;
		}
	]
};