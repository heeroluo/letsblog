/*!
 * LetsBlog
 * Routes of article management pages
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const pageType = require('../../page-type');
const articleModel = require('../../../entity/article');
const articleBLL = require('../../../bll/article');
const categoryBLL = require('../../../bll/category');


// 基本权限验证
function checkPermission(req) {
	if (!req.currentUser.group.perm_article && !req.currentUser.group.perm_manage_article) {
		return util.createError('权限不足', 403);
	}
}


// 发表新文章界面
exports.create = {
	template: 'admin/article__form/article__form',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				// 有文章管理权限的用户才能设置权重
				res.routeHelper.viewData(
					'canSetWeight',
					req.currentUser.group.perm_manage_article > 0
				);

				const article = articleModel.createEntity();
				// 默认权重
				article.weight = articleBLL.DEFAULT_WEIGHT;
				res.routeHelper.viewData('article', article);

				return categoryBLL.list().then((result) => {
					res.routeHelper.viewData('categoryList', result);
				});
			}
		)
	)
};

// 提交新文章
exports['create/post'] = {
	verb: 'post',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				const article = req.getEntity('article', 'insert');
				article.pubtime = new Date();

				return articleBLL.create(article, req.currentUser).then((result) => {
					res.routeHelper.viewData('articleid', result.insertId);
				});
			}
		)
	)
};


// 修改文章界面
exports.update = {
	pathPattern: '/article/update/:articleid',
	template: 'admin/article__form/article__form',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res) {
				// 有文章管理权限的用户才能设置权重
				res.routeHelper.viewData(
					'canSetWeight',
					req.currentUser.group.perm_manage_article > 0
				);

				const articleid = parseInt(req.params.articleid);
				return Promise.all([
					articleBLL.read(articleid).then((result) => {
						if (!result) {
							return util.createError('文章不存在', 404);
						} else if (!req.currentUser.group.perm_manage_article &&
							req.currentUser.userid != result.userid
						) {
							return util.createError('权限不足', 403);
						}

						res.routeHelper.viewData('article', result);
					}),

					categoryBLL.list().then((result) => {
						res.routeHelper.viewData('categoryList', result);
					})
				]);
			}
		)
	)
};

// 提交文章修改
exports['update/post'] = {
	pathPattern: '/article/update/:articleid/post',
	verb: 'post',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res) {
				const articleid = parseInt(req.params.articleid);

				return articleBLL.read(articleid).then((result) => {
					if (!result) {
						return util.createError('文章不存在', 404);
					} else if (!req.currentUser.group.perm_manage_article &&
						req.currentUser.userid != result.userid
					) {
						return util.createError('权限不足', 403);
					}
					return result;
				}).then((article) => {
					const newArticle = req.getEntity('article', 'update');
					newArticle.pubtime = req.body['update-pubtime'] ? new Date() : article.pubtime;
					return articleBLL.update(newArticle, articleid, req.currentUser);
				}).then(() => {
					// 更新成功后返回文章的id
					res.routeHelper.viewData('articleid', articleid);
				});
			}
		)
	)
};


// 文章列表
exports.list = pageType.admin(
	pageType.prepend(
		checkPermission,
		function(req, res) {
			// 没有管理权限的用户只能看到自己的文章
			const isPersonalPage =
				req.query.type == 'personal' || !req.currentUser.group.perm_manage_article;

			const page = parseInt(req.query.page) || 1;
			const params = isPersonalPage ? {
				userid: req.currentUser.userid
			} : {
				minWeight: parseInt(req.query.min_weight),
				maxWeight: parseInt(req.query.max_weight),
				categoryid: parseInt(req.query.categoryid),
				state: parseInt(req.query.state),
				username: req.query.username || '',
				title: req.query.title || ''
			};

			return Promise.all([
				articleBLL.list(params, 15, page).then((result) => {
					if (isPersonalPage) { params.type = 'personal'; }

					res.routeHelper.viewData({
						articleList: result,
						params,
						isPersonalPage
					});
				}),

				categoryBLL.list().then((result) => {
					res.routeHelper.viewData('categoryList', result);
				})
			]);
		}
	)
);


// 批量删除文章
exports['list/batch'] = {
	verb: 'post',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res) => {
				return articleBLL.delete(
					util.convert(req.body.articleids, 'array<int>'),
					req.currentUser.group.perm_manage_article ? 0 : req.currentUser.userid
				).then(() => {
					res.routeHelper.renderInfo(res, {
						message: '已删除指定文章'
					});
				});
			}
		)
	)
};


// 文件上传支持
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
	destination(req, file, callback) {
		function callCallback(err, targetDir, localDir) {
			if (targetDir) {
				req.res.routeHelper.viewData('path', targetDir);
			}
			callback(err, localDir);
		}

		const now = new Date();
		const targetDir = '/upload/article/' +
			now.getFullYear() +
			('0' + (now.getMonth() + 1)).slice(-2);
		const localDir = path.join(process.cwd(), targetDir);

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
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			(req, res, next) => {
				upload(req, res, (err) => {
					next(err);
				});
				return true;
			}
		)
	)
};


// 构建后CSS会被编译为JS，需要保留一份CSS给编辑器加载
exports['contentCSS'] = {
	callbacks(req, res) {
		res.sendFile(path.join(process.cwd(), 'public/contentCSS.css'));
		return true;
	}
};