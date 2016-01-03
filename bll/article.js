/*!
 * LetsBlog
 * Business logic layer of article
 * Released under MIT license
 */

'use strict';

var Promise = require('bluebird'),
	util = require('../lib/util'),
	validator = require('../lib/validator'),
	Cache = require('./_cache'),
	categoryBLL = require('./category'),
	commentBLL = require('./comment'),
	articleModel = require('../entity/article'),
	articleDAL = require('../dal/article');


// 读取文章列表（带分页）
var list = exports.list = function(params, pageSize, page) {
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

	return articleDAL.list(params, pageSize, page).then(function(result) {
		result.data = result.data.map(function(article) {
			article = articleModel.createEntity(article);
			return article;
		});

		return result;
	});
};


// 首页文章列表缓存
var homePageCache = new Cache(function() {
	return list({
		minWeight: 1,
		state: 1
	}, 10, 1).then(function(result) {
		// 冻结对象，防止因意外修改导致脏数据的出现
		if (result.data) {
			result.data.forEach(Object.freeze);
			Object.freeze(result.data);
		}
		Object.freeze(result);

		return result;
	});
}, {
	// 10分钟过期
	expires: 10 * 60 * 1000
});

// 获取首页文章列表
exports.getHomePageList = function() { return homePageCache.promise(); };


// 推荐文章列表缓存（10分钟过期）
var recommendedCache = new Cache(function() {
	return list({
		minWeight: 200,
		state: 1
	}, -1, 1).then(function(result) {
		result = result.data;
		// 冻结对象，防止因意外修改导致脏数据的出现
		if (result) {
			// 按权重排序
			result.sort(function(a, b) { return b.weight - a.weight; });
			result.forEach(Object.freeze);
		}
		Object.freeze(result);

		return result;
	});
}, {
	// 10分钟过期
	expires: 10 * 60 * 1000
});

// 获取推荐文章列表
exports.getRecommendedList = function() { return recommendedCache.promise(); };


// 清空缓存
var clearCache = exports.clearCache = function() {
	homePageCache.clear();
	recommendedCache.clear();
};


// 默认权重
var DEFAULT_WEIGHT = exports.DEFAULT_WEIGHT = 60;

// 截取文章摘要（分页符前的部分）
function getSummary(content) {
	return /<div\s+style=(["'])page-break-after:\s*always;?\1>/i.test(content) ?
		RegExp.leftContext : content;
}


// 行分隔符和段落分隔符
var re_separator = new RegExp('[' + String.fromCharCode(8232) + String.fromCharCode(8233) + ']', 'g');

// 创建和更新数据前的验证
function validate(article, user) {
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
	// 移除容易导致异常的字符
	article.content = article.content.replace(re_separator, '');
	// 截取摘要
	article.summary = getSummary(article.content);

	if (err) {
		return Promise.reject( util.createError(err) );
	} else {
		return categoryBLL.read(article.categoryid).then(function(category) {
			if (!category) {
				throw util.createError('分类不存在');
			}
		});
	}
}


// 创建文章
exports.create = function(article, user) {
	return validate(article, user).then(function() {
		return articleDAL.create( article.toDbRecord() ).then(function(result) {
			categoryBLL.clearCache();
			clearCache();
			return result;
		});
	});
};

// 更新文章
exports.update = function(article, articleid, user) {
	if ( validator.isAutoId(articleid) ) {
		return validate(article, user).then(function() {
			return articleDAL.update(article.toDbRecord(), articleid).then(function() {
				categoryBLL.clearCache();
				clearCache();
			});
		});
	} else {
		return Promise.reject( util.createError('无效的文章编号') );
	}
};


// 移除文章内容中用于截取摘要的分页符
exports.cleanContent = function(content) {
	return content.replace(/<div\s+style=(["'])page-break-after:\s*always;?\1>.*?<\/div>/i, '');
};

// 读取单条文章数据
exports.read = function(articleid) {
	if ( validator.isAutoId(articleid) ) {
		return articleDAL.read(articleid).then(function(result) {
			if (result && result[0]) {
				// 移除容易导致异常的字符
				result[0].content = result[0].content.replace(re_separator, '');
				return articleModel.createEntity(result[0]);
			}
		});
	} else {
		return Promise.reject( util.createError('无效的文章编号') );
	}
};


// 删除文章记录
exports.delete = function(articleids, userid) {
	var err;
	if (!articleids.length) {
		err = '请指定要操作的文章';
	} else if ( articleids.some(function(id) { return !validator.isAutoId(id); }) ) {
		err = '无效的文章编号';
	} 

	return err ?
		Promise.reject( util.createError(err) ) :
		Promise.all([
			// 删除文章的评论
			commentBLL.deleteByArticleIds(articleids),
			// 删除文章
			articleDAL.delete(articleids, userid)
		]).then(function() {
			categoryBLL.clearCache();
			clearCache();
		});
};


// 增加阅读次数
exports.addViews = function(articleid) {
	return validator.isAutoId(articleid) ?
		articleDAL.addViews(articleid) :
		Promise.reject( util.createError('无效的文章编号') );
};


// 获取上一篇和下一篇文章
exports.getAdjacentArticles = function(articleid, categoryid) {
	return Promise.all([
		articleDAL.adjacent(articleid, categoryid, 0),
		articleDAL.adjacent(articleid, categoryid, 1)
	]).then(function(results) {
		return results.map(function(result) {
			if (result && result[0]) {
				return articleModel.createEntity(result[0])
			}
		});
	});
};