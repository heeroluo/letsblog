/*!
 * LetsBlog
 * Data access layer of article
 * Released under MIT license
 */

'use strict';

var db = require('./_db');


exports.create = function(article) {
	return db.query('INSERT INTO article SET ?', article);
};

exports.read = function(articleid) {
	return db.query('SELECT * FROM article WHERE articleid = ? LIMIT 1', articleid);
};

exports.update = function(article, articleid) {
	return db.query('UPDATE article SET ? WHERE articleid = ?', [article, articleid]);
};

exports.delete = function(articleids, userid) {
	var sql = 'DELETE FROM article WHERE articleid IN (' + articleids.join(',') + ')';
	if (userid) { sql += ' AND userid = ' + userid; }
	return db.query(sql);
};

exports.addViews = function(articleid) {
	return db.query(
		'UPDATE article SET totalviews = totalviews + 1 WHERE articleid = ?', articleid
	);
};


var SELECT_ARTICLE_LIST = 'SELECT ' +
	'article.articleid,' +
	'article.title,' +
	'article.title_en,' +
	'article.keywords,' +
	'article.categoryid,' +
	'category.categoryname,' +
	'category.categoryname_en,' +
	'article.summary,' +
	'article.weight,' +
	'article.userid,' +
	'user.username,' +
	'user.nickname,' +
	'article.state,' +
	'article.pubtime,' +
	'article.totalviews,' +
	'article.totalcomments' +
' FROM article' +
' LEFT JOIN category ON article.categoryid = category.categoryid' +
' LEFT JOIN user ON article.userid = user.userid';

exports.list = function(params, pageSize, page) {
	var sql = SELECT_ARTICLE_LIST;

	var whereStr = [ ], whereParams = [ ];
	if (params) {
		// 最小权重
		if (params.minWeight != null) {
			whereStr.push('article.weight >= ?');
			whereParams.push(params.minWeight);
		}
		// 最大权重
		if (params.maxWeight != null) {
			whereStr.push('article.weight <= ?');
			whereParams.push(params.maxWeight);
		}
		// 分类编号
		if (params.categoryid != null) {
			whereStr.push('article.categoryid = ?');
			whereParams.push(params.categoryid);
		} else if (params.categoryids != null) {
			whereStr.push('article.categoryid IN (' + params.categoryids.join(',') + ')');
		}
		// 用户编号
		if (params.userid != null) {
			whereStr.push('article.userid = ?');
			whereParams.push(params.userid);
		}
		// 发布状态
		if (params.state != null) {
			whereStr.push('article.state = ?');
			whereParams.push(params.state);
		}
		// 用户名
		if (params.username) {
			whereStr.push('(LOCATE(?, user.username) > 0 || LOCATE(?, user.nickname) > 0)');
			whereParams.push(params.username);
			whereParams.push(params.username);
		}
		// 标题
		if (params.title) {
			whereStr.push('LOCATE(?, article.title) > 0');
			whereParams.push(params.title);
		}
	}
	if (whereStr.length) { sql += ' WHERE ' + whereStr.join(' AND '); }

	sql += ' ORDER BY article.pubtime DESC, article.weight DESC';

	return db.dataPaging(sql, {
		page: page,
		pageSize: pageSize,
		params: whereParams
	});
};


// 获取同分类下的相邻文章
exports.adjacent = function(articleid, categoryid, prevOrNext) {
	return db.query(
		SELECT_ARTICLE_LIST + ' WHERE article.articleid ' +
			(prevOrNext ? '>' : '<') + ' ? AND article.categoryid = ? ' +
			'ORDER BY article.articleid ' + (prevOrNext ? 'ASC' : 'DESC') + ' LIMIT 1',
		[articleid, categoryid]
	);
};