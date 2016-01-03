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
	var err;
	if (!req.currentUser.group.perm_article && !req.currentUser.group.perm_manage_article) {
		err = util.createError('权限不足', 403);
	}
	next(err);
}


// 发表新文章界面
exports.create = {
	template: 'admin/article-form',
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
exports.create__post = {
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
	template: 'admin/article-form',
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
exports.update__post = {
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
exports.list__batch = {
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

var storage = multer.diskStorage({
	destination: function(req, file, callback) {
		function callCallback(err, targetDir) {
			if (targetDir){
				req.res.routeHelper.viewData( 'path', targetDir.replace(/^\.\/public/, '') );
			}
			callback(err, targetDir);
		}

		var now = new Date();
		var targetDir = './public/upload/article/' +
				now.getFullYear() + ( '0' + (now.getMonth() + 1) ).slice(-2);

		var fs = require('fs');
		// 创建年月目录
		fs.exists(targetDir, function(exists) {
			if (exists) {
				callCallback(null, targetDir);
			} else {
				fs.mkdir(targetDir, function(err) {
					if (err) {
						callCallback(err);
					} else {
						callCallback(null, targetDir);
					}
				});
			}
		});
	},

	filename: function(req, file, callback) {
		var path = require('path'), now = new Date();

		// 重命名为 年+月+日+时+分+秒+5位随机数
		var fileName = util.formatDate(now, 'YYYYMMDDhhmmss') +
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

exports.attachment__upload = {
	verb: 'post',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(
			checkPermission,
			function(req, res, next) {
				upload(req, res, function(err) {
					next(err);
				});
			}
		)
	)
};


// exports.multer_upload = addPermissionChecking(
// 	multer({
// 		dest: './public/upload/',
// 		rename: function () {
// 			var now = new Date();
// 			// 重命名为 年+月+日+时+分+秒+5位随机数
// 			return now.getFullYear() +
// 				( '0' + (now.getMonth() + 1) ).slice(-2) +
// 				( '0' + now.getDate() ).slice(-2) +
// 				( '0' + now.getHours() ).slice(-2) +
// 				( '0' + now.getMinutes() ).slice(-2) +
// 				( '0' + now.getSeconds() ).slice(-2) +
// 				parseInt(10000 + Math.random() * 90000);
// 		}
// 	})
// );

// exports.upload_complete = addPermissionChecking(function(req, res, next) {
// 	var file = req.files.file, fs = require('fs');
// 	if (file && file.size) {
// 		if (file.size > 8 * 1024 * 1024) {
// 			fs.unlink(file.path);	// 从临时路径中移除
// 			next(util.createError('文件不能大于8MB'));
// 		} else {
// 			var	path = require('path');
// 			// 按年月归档
// 			util.moveToUploadDir(
// 				file.path,
// 				path.join('public', 'upload', 'article'),
// 				function(err, result) {
// 					if (err) {
// 						fs.unlink(file.path);	// 从临时路径中移除
// 					} else {
// 						result = result.split(path.sep);
// 						result[0] = '';
// 						res.routeHandler.setData('path', result.join('/'));
// 					}
// 					next(err);
// 				}
// 			);
// 		}
// 	} else {
// 		next(util.createError('请指定要上传的文件'));
// 	}
// });