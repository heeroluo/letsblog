/*!
 * LetsBlog
 * Routes of article
 * Released under MIT license
 */

'use strict';

var Promise = require('bluebird'),
	util = require('../../lib/util'),
	pageType = require('../page-type'),
	userBLL = require('../../bll/user'),
	articleBLL = require('../../bll/article');


// 文章列表
exports.list = {
	pathPattern: /\/list\/(\d+)(?:\/[a-z1-9\-]+)?$/,
	callbacks: pageType.normal(function(req, res, next) {
		// 首页文章列表数据和非首页文章列表数据从不同的接口获取
		// 获取后都需要经过此函数处理
		function handleArticleList(result) {
			res.routeHelper.viewData('articleList', result);
		}

		var categoryid = parseInt(req.params[0]) || 0,
			page = parseInt(req.query.page) || 1,
			tasks = [ ];

		if (!categoryid && page === 1) {
			tasks.push( articleBLL.getHomePageList().then(handleArticleList) );
		} else {
			var params = { };

			if (categoryid) {
				// 检查分类是否存在
				var categoryList = res.routeHelper.viewData('categoryList'), category;
				for (var i = categoryList.length - 1; i >= 0; i--) {
					if (categoryList[i].categoryid == categoryid) {
						category = categoryList[i];
						break;
					}
				}

				if (category) {
					params.categoryid = categoryid;
					res.routeHelper.viewData('categoryid', categoryid);
				} else {
					next( util.createError('分类不存在或不可见', 404) );
					return;
				}
			}

			// 只加载可见文章
			params.minWeight = 1;
			params.state = 1;

			tasks.push( articleBLL.list(params, 10, page).then(handleArticleList) );
		}

		tasks.push(
			articleBLL.getRecommendedList().then(function(result) {
				res.routeHelper.viewData('recommendedArticles', result);
			})
		);

		return Promise.all(tasks);
	})
};


// 文章详情
exports.detail = {
	pathPattern: /\/detail\/(\d+)(?:\/[a-z1-9\-]+)?$/,
	callbacks: pageType.normal(function(req, res, next) {
		return articleBLL.read( parseInt(req.params[0]) ).then(function(article) {
			if (article) {
				var categoryList = res.routeHelper.viewData('categoryList'), category;
				for (var i = categoryList.length - 1; i >= 0; i--) {
					if (categoryList[i].categoryid == article.categoryid) {
						category = categoryList[i];
						break;
					}
				}

				if (category) {
					res.routeHelper.title(category.categoryname);
					res.routeHelper.title(article.title);

					article.content = articleBLL.cleanContent(article.content);

					res.routeHelper.viewData('category', category);
					res.routeHelper.viewData('categoryid', article.categoryid);
					res.routeHelper.viewData('article', article);
					if (article.keywords) {
						res.routeHelper.keywords( article.keywords.split(/\s*,\s*/) );	
					}
				} else {
					throw util.createError('您没有权限查看此文章', 403);
				}
			} else {
				throw util.createError('文章不存在', 404);
			}
			return article;
		}).then(function(article) {
			return Promise.all([
				userBLL.readByUserId(article.userid),
				articleBLL.getAdjacentArticles(article.articleid, article.categoryid)
			]);
		}).then(function(results) {
			res.routeHelper.viewData('author', results[0]);
			res.routeHelper.viewData('prevArticle', results[1][0]);
			res.routeHelper.viewData('nextArticle', results[1][1]);
		});
	})
};


// 增加浏览次数
exports.view = {
	pathPattern: '/view/:articleid',
	callbacks: function(req, res, next) {
		if (req.cookies.seen === '1') {
			res.end();
		} else {
			var articleid = req.params.articleid;
			articleBLL.addViews(articleid).then(function() {
				// 1小时内重复查看不增加浏览次数
				var expires = new Date(Date.now() + 60 * 60 * 1000);

				// 设置过期时间，但如果用户按了刷新，就依靠cookie中的标识判断是否浏览过
				res.setHeader( 'Cache-Control', 'public, max-age=' + parseInt(expires / 1000) );
				res.setHeader( 'Expires', expires.toUTCString() );
				res.cookie( 'seen', '1', {
					expires: expires,
					path: '/article/detail/' + articleid
				} );

				res.end();
			});
		}
	}
};