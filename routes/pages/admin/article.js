/*!
 * LetsBlog
 * Routes of article management pages
 * Released under MIT license
 */

'use strict';

var Promise = require('bluebird'),
	util = require('../../../lib/util'),
	pageType = require('../../page-type'),
	articleModel = require('../../../entity/article'),
	articleBLL = require('../../../bll/article'),
	categoryBLL = require('../../../bll/category');


// 基本权限验证
function checkPermission(req, res, next) {
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
			function(req, res, next) {
				// 有文章管理权限的用户才能设置权重
				res.routeHelper.viewData(
					'canSetWeight',
					req.currentUser.group.perm_manage_article > 0
				);

				var article = articleModel.createEntity();
				// 默认权重
				article.weight = articleBLL.DEFAULT_WEIGHT;
				res.routeHelper.viewData('article', article);

				return categoryBLL.list().then(function(result) {
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
			function(req, res, next) {
				var article = req.getEntity('article', 'insert');
				article.pubtime = new Date();

				return articleBLL.create(article, req.currentUser).then(function(result) {
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
			function(req, res, next) {
				// 有文章管理权限的用户才能设置权重
				res.routeHelper.viewData(
					'canSetWeight',
					req.currentUser.group.perm_manage_article > 0
				);

				var articleid = parseInt(req.params.articleid);
				return Promise.all([
					articleBLL.read(articleid).then(function(result) {
						if (!result) {
							throw util.createError('文章不存在', 404);
						} else if (!req.currentUser.group.perm_manage_article &&
							req.currentUser.userid != result.userid
						) {
							throw util.createError('权限不足', 403);
						}

						res.routeHelper.viewData('article', result);
					}),

					categoryBLL.list().then(function(result) {
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
			function(req, res, next) {
				var articleid = parseInt(req.params.articleid);

				return articleBLL.read(articleid).then(function(result) {
					if (!result) {
						throw util.createError('文章不存在', 404);
					} else if (!req.currentUser.group.perm_manage_article &&
						req.currentUser.userid != result.userid
					) {
						throw util.createError('权限不足', 403);
					}
					return result;
				}).then(function(article) {
					var newArticle = req.getEntity('article', 'update');
					newArticle.pubtime = req.body['update-pubtime'] ? new Date() : article.pubtime;
					return articleBLL.update(newArticle, articleid, req.currentUser);
				}).then(function() {
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
		function(req, res, next) {
			// 没有管理权限的用户只能看到自己的文章
			var isPersonalPage =
				req.query.type == 'personal' || !req.currentUser.group.perm_manage_article;

			var page = parseInt(req.query.page) || 1,
				params = isPersonalPage ?
					{ userid: req.currentUser.userid } :
					{
						minWeight: parseInt(req.query.min_weight),
						maxWeight: parseInt(req.query.max_weight),
						categoryid: parseInt(req.query.categoryid),
						state: parseInt(req.query.state),
						username: req.query.username || '',
						title: req.query.title || ''
					};

			return Promise.all([
				articleBLL.list(params, 15, page).then(function(result) {
					if (isPersonalPage) { params.type = 'personal'; }

					res.routeHelper.viewData({
						articleList: result,
						params: params,
						isPersonalPage: isPersonalPage,
					});
				}),

				categoryBLL.list().then(function(result) {
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
			function(req, res, next) {
				return articleBLL.delete(
					util.convert(req.body.articleids, 'array<int>'),
					req.currentUser.group.perm_manage_article ? 0 : req.currentUser.userid
				).then(function() {
					res.routeHelper.renderInfo(res, {
						message: '已删除指定文章'
					});
				});
			}
		)
	)
};


// 文件上传支持
var multer  = require('multer');
var path = require('path');
var fs = require('fs');

var storage = multer.diskStorage({
	destination: function(req, file, callback) {
		function callCallback(err, targetDir, localDir) {
			if (targetDir){
				req.res.routeHelper.viewData('path', targetDir);
			}
			callback(err, localDir);
		}

		var now = new Date();
		var targetDir = '/upload/article/' +
			now.getFullYear() +
			( '0' + (now.getMonth() + 1) ).slice(-2);
		var localDir = path.join(process.cwd(), targetDir);

		// 创建年月目录
		fs.exists(localDir, function(exists) {
			if (exists) {
				callCallback(null, targetDir, localDir);
			} else {
				fs.mkdir(localDir, function(err) {
					if (err) {
						callCallback(err);
					} else {
						callCallback(null, targetDir, localDir);
					}
				});
			}
		});
	},

	filename: function(req, file, callback) {
		var path = require('path'), now = new Date();

		// 重命名为 年+月+日+时+分+秒+5位随机数
		var fileName = now.getFullYear() +
			('0' + (now.getMonth() + 1)).slice(-2) +
			('0' + (now.getDate() + 1)).slice(-2) +
			('0' + (now.getHours() + 1)).slice(-2) +
			('0' + (now.getMinutes() + 1)).slice(-2) +
			('0' + (now.getSeconds() + 1)).slice(-2) +
			parseInt(10000 + Math.random() * 90000) +
			path.extname(file.originalname);

		req.res.routeHelper.viewData(
			'path',
			req.res.routeHelper.viewData('path') + '/' + fileName
		);

		callback(null, fileName);
	}
});

var upload = multer({
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
			function(req, res, next) {
				upload(req, res, function(err) {
					next(err);
				});
				return true;
			}
		)
	)
};