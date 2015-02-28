/*!
 * LetsBlog
 * Routes of article management pages (2015-02-25T16:04:03+0800)
 * Released under MIT license
 */

'use strict';

var async = require('async'),
	util = require('../../lib/util'),
	articleModel = require('../../entity/article'),
	articleBLL = require('../../bll/article'),
	categoryBLL = require('../../bll/category');


// 基本权限检查
function addPermissionChecking(handler) {
	return function(req, res, next) {
		if (req.currentUser.group.perm_article || req.currentUser.group.perm_manage_article) {
			handler.apply(this, arguments);
		} else {
			next( util.createError('权限不足', 403) );
		}
	};
}


exports.create = addPermissionChecking(function(req, res, next) {
	categoryBLL.list(function(err, result) {
		if (!err) {
			res.routeHandler.setData(
				'canSetWeight',
				req.currentUser.group.perm_manage_article > 0
			);
			res.routeHandler.setData('categoryList', result);
			var article = articleModel.createEntity();
			// 默认权重
			article.weight = articleBLL.DEFAULT_WEIGHT;
			res.routeHandler.setData('article', article);
			res.routeHandler.setData('articleContentJSON', JSON.stringify(article.content));
		}
		next(err);
	});
});

exports.create_post = addPermissionChecking(function(req, res, next) {
	var article = req.getEntity('article', 'insert');
	article.pubtime = new Date();

	articleBLL.create(article, req.currentUser, function(err, result) {
		if (!err) {
			res.routeHandler.setData('articleid', result.insertId);
		}
		next(err);
	});
});


exports.update = addPermissionChecking(function(req, res, next) {
	res.routeHandler.setData('canSetWeight', req.currentUser.group.perm_manage_article > 0);

	async.parallel([function(callback) {
		var articleid = parseInt(req.params.articleid);
		articleBLL.read(articleid, function(err, result) {
			if (!err) {
				if (!result) {
					err = util.createError('文章不存在', 404);
				} else if (!req.currentUser.group.perm_manage_article &&
					req.currentUser.userid != result.userid
				) {
					err = util.createError('权限不足', 403);
				}
				res.routeHandler.setData('article', result);
				res.routeHandler.setData('articleContentJSON', JSON.stringify(result.content));
			}
			callback(err);
		});
	}, function(callback) {
		categoryBLL.list(function(err, result) {
			if (!err) {
				res.routeHandler.setData('categoryList', result);
			}
			callback(err);
		});
	}], next);
});

exports.update_post = addPermissionChecking(function(req, res, next) {
	var articleid = parseInt(req.params.articleid);

	async.waterfall([function(callback) {
		articleBLL.read(articleid, function(err, result) {
			if (!err) {
				if (!result) {
					err = util.createError('文章不存在', 404);
				} else if (!req.currentUser.group.perm_manage_article &&
					req.currentUser.userid != result.userid
				) {
					err = util.createError('权限不足', 403);
				}
			}
			callback(err, result);
		});
	}, function(article, callback) {
		var newArticle = req.getEntity('article', 'update');
		newArticle.pubtime = req.body['update-pubtime'] ? new Date() : article.pubtime;
		articleBLL.update(newArticle, articleid, req.currentUser, callback);
	}], function(err) {
		if (!err) {
			// 更新成功后返回文章的id
			res.routeHandler.setData('articleid', articleid);
		}
		next(err);
	});
});


exports.list = addPermissionChecking(function(req, res, next) {
	// 没有管理权限的用户只能看到自己的文章
	var isPersonalPage =
		req.query.type == 'personal' ||
		!req.currentUser.group.perm_manage_article;

	async.parallel([function(callback) {
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

		articleBLL.list(params, 15, page, function(err, result) {
			if (!err) {
				if (result.data) {
					result.data.forEach(function(article) {
						article.pubtime_formatted = util.formatDate(
							article.pubtime,
							'yyyy-MM-dd HH:mm:ss'
						);
					});
				}
				res.routeHandler.setData('articleList', result.data);

				if (isPersonalPage) { params.type = 'personal'; }

				var hrefTpl = util.toQueryString(params);
				if (hrefTpl) {
					hrefTpl = '?' + hrefTpl + '&amp;';
				} else {
					hrefTpl = '?';
				}
				hrefTpl += 'page={{page}}';

				res.routeHandler.setData('params', params);
				res.routeHandler.setData('isPersonalPage', isPersonalPage);

				// 分页条
				if (result.totalPages > 1) {
					res.routeHandler.setData('paginator', util.createPaginatorData(
						result.page, result.totalPages, hrefTpl
					));
				}
			}
			callback(err);
		});
	}, function(callback) {
		categoryBLL.list(function(err, result) {
			res.routeHandler.setData('categoryList', result);
			callback(err);
		});
	}], next);
});


exports.delete_post = addPermissionChecking(function(req, res, next) {
	var articleids = util.convert(req.body.articleids, 'array<int>');
	articleBLL.delete(
		articleids,
		req.currentUser.group.perm_manage_article ? 0 : req.currentUser.userid,
		function(err) {
			if (err) {
				next(err);
			} else {
				res.routeHandler.renderInfo(res, {
					message: '已删除指定文章'
				});
			}
		}
	);
});


exports.upload_post = addPermissionChecking(function(req, res, next) {
	var file = req.files.file, fs = require('fs');
	if (file && file.size) {
		if (file.size > 8 * 1024 * 1024) {
			fs.unlink(file.path);	// 从临时路径中移除
			next(util.createError('文件不能大于8MB'));
		} else {
			var	path = require('path');
			// 按年月归档
			util.moveToUploadDir(
				file.path,
				path.join('public', 'upload', 'article'),
				function(err, result) {
					if (err) {
						fs.unlink(file.path);	// 从临时路径中移除
					} else {
						result = result.split(path.sep);
						result[0] = '';
						res.routeHandler.setData('path', result.join('/'));
					}
					next(err);
				}
			);
		}
	} else {
		next(util.createError('请指定要上传的文件'));
	}
});