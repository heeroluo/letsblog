const categoryBLL = require('./category');
const commentBLL = require('./comment');
const articleDAL = require('../dal/article');
const { isAutoId } = require('./validator/common');
const { validate, checkListParams } = require('./validator/article');
const { createError } = require('../lib/util');
const PromiseCache = require('../lib/promise-cache');


// 读取文章列表（带分页）
const list = exports.list = async(pageSize, page, params) => {
	if (params) {
		const err = checkListParams(params);
		if (err) { throw createError(err, 400); }
	}
	return articleDAL.list(pageSize, page, params);
};


// 首页文章列表缓存
const homePageCache = new PromiseCache(async() => {
	const result = await list(10, 1, {
		minWeight: 1,
		state: 1
	});

	// 冻结数据，防止意外修改
	result.rows.forEach(Object.freeze);
	Object.freeze(result.rows);
	Object.freeze(result);

	return result;
}, {
	// 10分钟过期
	expires: 10 * 60 * 1000
});

// 获取首页文章列表
exports.getHomePageList = async() => {
	return homePageCache.promise();
};


// 推荐文章列表缓存（10分钟过期）
const recommendedCache = new PromiseCache(async() => {
	const result = await list(20, 1, {
		minWeight: 200,
		state: 1
	});

	// 冻结数据，防止意外修改
	result.rows.forEach(Object.freeze);
	Object.freeze(result.rows);

	return result.rows;
}, {
	// 10分钟过期
	expires: 10 * 60 * 1000
});

// 获取推荐文章列表
exports.getRecommendedList = async() => {
	return (await recommendedCache.promise()).slice();
};


// 清空缓存
const clearCache = exports.clearCache = () => {
	homePageCache.clear();
	recommendedCache.clear();
};


// 默认权重
const DEFAULT_WEIGHT = exports.DEFAULT_WEIGHT = 60;

// 行分隔符和段落分隔符（JSON序列化时，这两个字符不会被编码，容易导致异常，移除之）
const reSeparator = new RegExp(
	'[' + String.fromCharCode(8232) + String.fromCharCode(8233) + ']', 'g'
);

// 摘要分隔符
const reSummarySep = /<div\s+style=(["'])page-break-after:\s*always;?\1>.*?<\/div>/i;

// 截取文章摘要（分页符前的部分）
function getSummary(content) {
	return reSummarySep.test(content) ? RegExp.leftContext : content;
}

// 移除文章内容中用于截取摘要的分页符
exports.cleanContent = (content) => { return content.replace(reSummarySep, ''); };


// 创建和更新数据前的验证
async function validateMain(article, user) {
	const err = validate(article);
	if (err) { return err; }

	const category = await categoryBLL.read(article.categoryid);
	if (!category) { return '分类不存在'; }

	// 容错处理，中文逗号替换为英文逗号
	if (article.keywords) { article.keywords = article.keywords.replace(/，/g, ','); }
	// 清理末尾的空段落
	article.content = article.content.replace(/(?:\s*<p>(?:&nbsp;|\s)*<\/p>\s*)+$/, '');
	// 移除容易导致异常的字符
	article.content = article.content.replace(reSeparator, '');
	// 截取摘要
	article.summary = getSummary(article.content);
	// 设定作者
	article.userid = user.userid;
	// 拥有文章管理权限的用户才能指定权重，否则使用默认值
	if (!user.usergroup.perm_manage_article) { article.weight = DEFAULT_WEIGHT; }
}


// 创建文章
exports.create = async(article, user) => {
	const err = await validateMain(article, user);
	if (err) { throw createError(err, 400); }

	const result = await articleDAL.create(article);

	// 发表文章后，所属分类文章数发生变化
	categoryBLL.clearCache();
	// 首页文章和推荐文章可能发生变化
	clearCache();

	return result;
};

// 更新文章
exports.update = async(article, id, user) => {
	const err = !isAutoId(id) ?
		'无效的文章编号' :
		await validateMain(article, user);

	if (err) { throw createError(err, 400); }

	await articleDAL.update(article, id);

	// 如果修改了所属分类，则新旧分类的文章数皆发生变化
	categoryBLL.clearCache();
	// 首页文章和推荐文章可能发生变化
	clearCache();
};


// 删除文章记录
exports.delete = async(articleids, userid) => {
	if (!articleids.length) {
		throw createError('请指定要操作的文章', 400);
	} else if (articleids.some((id) => { return !isAutoId(id); })) {
		throw createError('无效的文章编号', 400);
	}

	await Promise.all([
		// 删除文章的评论
		commentBLL.deleteByArticleIds(articleids),
		// 删除文章
		articleDAL.delete(articleids, userid)
	]);

	// 删除文章后，所属分类的文章数会发生变化
	categoryBLL.clearCache();
	// 删除文章后，首页文章和推荐文章可能会发生变化
	clearCache();
};


// 读取单条文章数据
exports.read = async(id) => {
	if (!isAutoId(id)) {
		throw createError('无效的文章编号', 400);
	}

	const result = await articleDAL.read(id);
	if (result) {
		// 移除容易导致异常的字符
		result.content = result.content.replace(reSeparator, '');
	}
	return result;
};


// 增加阅读次数
exports.addViews = async(id) => {
	if (!isAutoId(id)) {
		throw createError('无效的文章编号', 400);
	}
	await articleDAL.addViews(id);
};


// 获取上一篇和下一篇文章
exports.getAdjacentArticles = async(articleid, categoryid) => {
	return [
		await articleDAL.adjacent(articleid, categoryid, 0),
		await articleDAL.adjacent(articleid, categoryid, 1)
	];
};