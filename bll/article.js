/*!
 * LetsBlog
 * Business logic layer of article (2015-03-07T17:12:59+0800)
 * Released under MIT license
 */

'use strict';

var async = require('async'),
	util = require('../lib/util'),
	validator = require('../lib/validator'),
	Cache = require('./_cache'),
	categoryBLL = require('./category'),
	commentBLL = require('./comment'),
	articleModel = require('../entity/article'),
	articleDAL = require('../dal/article');


var list = exports.list = function(params, pageSize, page, callback) {
	if (params) {
		if (isNaN(params.minWeight) || params.minWeight < 0) { delete params.minWeight; }
		if (isNaN(params.maxWeight) || params.maxWeight < 0) { delete params.maxWeight; }
		if (isNaN(params.state) || params.state < 0) { delete params.state; }
		if ( !validator.isAutoId(params.categoryid) ) { delete params.categoryid; }
		if ( !validator.isAutoId(params.userid) ) { delete params.userid; }
		if (params.categoryids) {
			params.categoryids = params.categoryids.filter(function(id) {
				return validator.isAutoId(id);
			});
			if (!params.categoryids.length) { delete params.categoryids; }
		}
	}

	articleDAL.list(params, pageSize, page, function(err, result) {
		if (result && result.data) {
			result.data = result.data.map(function(d) {
				d = articleModel.createEntity(d);
				d.pubtime_formatted = util.formatDateFromNow(d.pubtime);
				return d;
			});
		}
		callback(err, result);
	});
};


// 缓存首页列表数据和推荐文章数据
var articleCache = new Cache(function(setCache) {
	async.parallel([function(callback) {
		list({
			minWeight: 1,
			state: 1
		}, 10, 1, function(err, result) {
			if (!err) {
				if (result.data) {
					result.data.forEach(function(d) { Object.freeze(d); });
					Object.freeze(result.data);
				}
				Object.freeze(result);
			}
			callback(err, result);
		});
	}, function(callback) {
		list({
			minWeight: 200,
			state: 1
		}, -1, 1, function(err, result) {
			if (!err) {
				result = result.data;
				if (result) {
					result.sort(function(a, b) { return b.weight - a.weight; });
					result.forEach(function(d) { Object.freeze(d); });
				}
				Object.freeze(result);
			}
			callback(err, result);
		});
	}], function(err, results) {
		setCache(err, results ? {
			homePageArticles: results[0],
			recommendedArticles: results[1]
		}: null);
	});
}, exports, {
	expires: 10 * 60 * 1000
});
var addClearCacheAction = exports.addClearCacheAction;

// 获取首页文章
exports.getHomePageArticles = function(callback) {
	articleCache.get(function(err, result) {
		callback(err, result ? result.homePageArticles : null);
	});
};

// 获取推荐文章
exports.getRecommendedArticles = function(callback) {
	articleCache.get(function(err, result) {
		callback(err, result ? result.recommendedArticles : null);
	});
};


// 默认权重
var DEFAULT_WEIGHT = exports.DEFAULT_WEIGHT = 60;

// 截取摘要
function getSummary(content) {
	return /<div\s+style=(["'])page-break-after:\s*always;?\1>/i.test(content) ?
		RegExp.leftContext : content;
}

function validate(article, user, callback) {
	var err;

	if (!article.title) {
		err = '标题不能为空';
	} else if ( article.title_en && !validator.isEnTitle(article.title_en) ) {
		err = '英文标题只能包含小写字母、数字和连字符';
	} else if (!article.categoryid) {
		err = '分类不能为空';
	} else if (article.weight < 0 || article.weight > 999) {
		err = '权重必须为0-999间的整数';
	} else if ([0, 1].indexOf(article.state) === -1) {
		err = '无效的状态参数';
	}

	article.userid = user.userid;
	// 拥有文章管理权限的用户才能指定权重，否则使用默认值
	if (!user.group.perm_manage_article) { article.weight = DEFAULT_WEIGHT; }
	// 容错处理，中文逗号替换为英文逗号
	if (article.keywords) { article.keywords = article.keywords.replace(/，/g, ','); }
	// 清理末尾的空段落
	article.content = article.content.replace(/(?:<p>(?:&nbsp;|\s)*<\/p>)+$/, '');
	// 截取摘要
	article.summary = getSummary(article.content);

	if (err) {
		callback( util.createError(err) );
	} else {
		categoryBLL.read(article.categoryid, function(err, category) {
			if (!err) {
				if (!category) {
					err = util.createError('分类不存在');
				}
			}
			callback(err);
		});
	}
}


exports.create = function(article, user, callback) {
	validate(article, user, function(err) {
		if (err) {
			callback(err);
		} else {
			articleDAL.create(
				article.toDbRecord(),
				addClearCacheAction(categoryBLL.addClearCacheAction(callback))
			);
		}
	});
};

exports.update = function(article, articleid, user, callback) {
	if ( validator.isAutoId(articleid) ) {
		validate(article, user, function(err, result) {
			if (err) {
				callback(err);
			} else {
				article.summary = getSummary(article.content);
				articleDAL.update(
					article.toDbRecord(),
					articleid,
					addClearCacheAction(categoryBLL.addClearCacheAction(callback))
				);
			}
		});
	} else {
		callback(util.createError('无效的文章编号'));
	}
};


// 移除文章内容中的多余标签
exports.cleanContent = function(content) {
	return content.replace(/<div\s+style=(["'])page-break-after:\s*always;?\1>.*?<\/div>/i, '');
};

exports.read = function(articleid, callback) {
	if ( validator.isAutoId(articleid) ) {
		articleDAL.read(articleid, function(err, result) {
			callback(err, result && result[0] ? articleModel.createEntity(result[0]) : null);
		});
	} else {
		callback( util.createError('无效的文章编号') );
	}
};


exports.delete = function(articleids, userid, callback) {
	if ( articleids.some(function(id) { return !validator.isAutoId(id); }) ) {
		callback( util.createError('无效的文章编号') );
	} else {
		// 删除评论（无需理会何时完成）
		commentBLL.deleteByArticleIds(articleids);
		// 删除文章
		articleDAL.delete(
			articleids,
			userid,
			addClearCacheAction(categoryBLL.addClearCacheAction(callback))
		);
	}
};


exports.addViews = function(articleid, callback) {
	if ( validator.isAutoId(articleid) ) {
		articleDAL.addViews(articleid, callback);
	} else {
		if (callback) {
			callback(util.createError('无效的文章编号'));
		}
	}
};


// 获取上一篇和下一篇文章
exports.getAdjacentArticles = function(articleid, categoryid, callback) {
	async.parallel([function(callback) {
		articleDAL.adjacent(articleid, categoryid, 0, function(err, result) {
			callback(err, result);
		});
	}, function(callback) {
		articleDAL.adjacent(articleid, categoryid, 1, function(err, result) {
			callback(err, result);
		});
	}], function(err, results) {
		if (!err) {
			results = results.map(function(result) {
				return result && result[0] ? articleModel.createEntity(result[0]) : null;
			});
		}
		callback(err, results);
	});
};