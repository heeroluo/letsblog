/*!
 * LetsBlog
 * Routes of article (2015-03-07T17:05:23+0800)
 * Released under MIT license
 */

'use strict';

var async = require('async'),
	util = require('../lib/util'),
	articleBLL = require('../bll/article'),
	userBLL = require('../bll/user');


exports.list = function(req, res, next) {
	var categoryid = parseInt(req.params[0]) || 0,
		page = parseInt(req.query.page) || 1,
		tasks = [ ];

	if (!categoryid && page === 1) {
		tasks.push(articleBLL.getHomePageArticles);
	} else {
		var params = { };

		if (categoryid) {
			// 检查分类是否存在
			var category = res.routeHandler.getData('categoryList').filter(function(category) {
				return category.categoryid === categoryid;
			})[0];

			if (category) {
				params.categoryid = categoryid;
			} else {
				next(util.createError('分类不存在或不可见', 404));
				return;
			}
		}

		// 只加载可见文章
		params.minWeight = 1;
		params.state = 1;

		tasks.push(function(callback) {
			articleBLL.list(params, 10, page, callback);
		});
	}

	tasks.push(articleBLL.getRecommendedArticles);


	async.parallel(tasks, function(err, results) {
		if (!err) {
			res.routeHandler.setData('categoryid', categoryid);
			if (results[0].data) {
				res.routeHandler.setData('articleList', results[0].data);
			}
			if (results[0].totalPages > 1) {
				res.routeHandler.setData('paginator', util.createPaginatorData(
					results[0].page, results[0].totalPages, '?page={{page}}'
				));
			}
			res.routeHandler.setData('recommendedArticles', results[1]);
		}
		next(err);
	});
};


// 文章详情
exports.detail = function(req, res, next) {
	async.waterfall([function(callback) {
		// 读取文章数据
		articleBLL.read(parseInt(req.params[0]), function(err, article) {
			if (!err) {
				if (!article) {
					err = util.createError('文章不存在', 404);
				}
			}
			callback(err, article);
		});
	}, function(article, callback) {
		// 读取作者信息
		userBLL.readByUserId(article.userid, function(err, result) {
			callback(err, article, result);
		});
	}, function(article, author, callback) {
		// 检查文章分类是否在可访问分类中
		var category = res.routeHandler.getData('categoryList').filter(function(category) {
			return category.categoryid === article.categoryid;
		})[0];

		var err;
		if (category) {
			var titleArr = res.routeHandler.getData('title');
			titleArr.unshift(category.categoryname);
			titleArr.unshift(article.title);

			article.content = articleBLL.cleanContent(article.content);
			article.pubtime_formatted = util.formatDateFromNow(article.pubtime);

			res.routeHandler.setData('category', category);
			res.routeHandler.setData('categoryid', article.categoryid);
			res.routeHandler.setData('article', article);
			res.routeHandler.setData('author', author);
		} else {
			err = util.createError('您没有权限查看此文章', 403);
		}

		callback(err, article);
	}, function(article, callback) {
		articleBLL.getAdjacentArticles(
			article.articleid,
			article.categoryid,
			function(err, results) {
				if (!err) {
					res.routeHandler.setData('prevArticle', results[0]);
					res.routeHandler.setData('nextArticle', results[1]);
				}
				callback(err);
			}
		);
	}], next);
};


// 增加查看次数
exports.addViews = function(req, res, next) {
	articleBLL.addViews(req.params.articleid);

	// 一天内不重新请求
	res.setHeader('Cache-Control', 'public, max-age=86400');
	res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString());
	res.end();
};