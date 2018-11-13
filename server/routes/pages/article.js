/*!
 * LetsBlog
 * Routes of article
 * Released under MIT license
 */

'use strict';

const util = require('../../lib/util');
const userBLL = require('../../bll/user');
const categoryBLL = require('../../bll/category');
const articleBLL = require('../../bll/article');
const pageType = require('../page-type');


// 文章列表
exports.list = {
	pathPattern: /^\/list\/(\d+)(?:\/[a-zA-Z1-9-]+)?$/,
	callbacks: pageType.normal(async(req, res) => {
		// 首页文章列表数据和非首页文章列表数据从不同的接口获取
		// 获取后都需要经过此函数处理
		function handleArticleList(result) {
			res.routeHelper.viewData('articleList', result);
		}

		const categoryid = parseInt(req.params[0]) || 0;
		const page = parseInt(req.query.page) || 1;
		const tasks = [];

		if (!categoryid && page === 1) {
			tasks.push(
				async() => {
					handleArticleList(await articleBLL.getHomePageList());
				}
			);
		} else {
			tasks.push(
				async() => {
					const params = {};

					if (categoryid) {
						// 检查分类是否存在
						const category = await categoryBLL.read(categoryid);
						if (category && category.weight > 0) {
							params.categoryid = categoryid;
							res.routeHelper.prependTitle(category.categoryname);
						} else {
							throw util.createError('分类不存在或不可见', 404);
						}
					}

					// 只加载可见文章
					params.minWeight = 1;
					params.state = 1;

					handleArticleList(
						await articleBLL.list(10, page, params)
					);
				}
			);
		}

		tasks.push(
			async() => {
				res.routeHelper.viewData(
					'recommendedArticles',
					await articleBLL.getRecommendedList()
				);
			}
		);

		res.routeHelper.viewData('categoryid', categoryid);

		return Promise.all(
			tasks.map((task) => { return task(); })
		);
	})
};


// 文章详情
exports.detail = {
	pathPattern: /^\/detail\/(\d+)(?:\/[a-zA-Z1-9-]+)?$/,
	callbacks: pageType.normal(async(req, res) => {
		const article = await articleBLL.read(parseInt(req.params[0]));

		if (article) {
			const category = await categoryBLL.read(article.categoryid);

			if (category && category.weight > 0) {
				res.routeHelper.prependTitle(category.categoryname);
				res.routeHelper.prependTitle(article.title);
				article.content = articleBLL.cleanContent(article.content);
				if (article.keywords) {
					res.routeHelper.appendKeywords(article.keywords.split(/\s*,\s*/));
				}

				res.routeHelper.viewData({
					category: category,
					categoryid: article.categoryid,
					article: article
				});
			} else {
				throw util.createError('您没有权限查看此文章', 403);
			}
		} else {
			throw util.createError('文章不存在', 404);
		}

		return Promise.all([
			async() => {
				res.routeHelper.viewData(
					'author',
					await userBLL.readByUserId(article.userid)
				);
			},

			async() => {
				const articles = await articleBLL.getAdjacentArticles(
					article.articleid, article.categoryid
				);
				res.routeHelper.viewData({
					prevArticle: articles[0],
					nextArticle: articles[1]
				});
			}
		].map((task) => { return task(); }));
	})
};


// 增加浏览次数
exports.view = {
	pathPattern: '/view/:articleid',
	callbacks: async(req, res) => {
		if (!req.cookies.seen) {
			const articleid = req.params.articleid;

			await articleBLL.addViews(articleid);

			// 1小时内重复查看不增加浏览次数
			const expires = new Date(Date.now() + 60 * 60 * 1000);
			// 设置过期时间，但如果用户按了刷新，就依靠cookie中的标识判断是否浏览过
			res.setHeader('Cache-Control', 'public, max-age=' + parseInt(expires / 1000));
			res.setHeader('Expires', expires.toUTCString());
			res.cookie('seen', '1', {
				expires: expires,
				path: '/article/detail/' + articleid
			});
		}

		res.end();
		return true;
	}
};