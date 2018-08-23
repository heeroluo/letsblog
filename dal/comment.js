/*!
 * LetsBlog
 * Data access layer of comment
 * Released under MIT license
 */

'use strict';

const db = require('./_db');


exports.create = (comment) => {
	return db.query('INSERT INTO comment SET ?', comment);
};

exports.updateState = (state, commentids) => {
	return db.query(
		'UPDATE comment SET state = ' + state + ' WHERE commentid IN (' + commentids.join(',') + ')'
	);
};


exports.deleteByCommentIds = (commentids) => {
	return db.query('DELETE FROM comment WHERE commentid IN (' + commentids.join(',') + ')');
};

exports.deleteByArticleIds = (articleids) => {
	return db.query('DELETE FROM comment WHERE articleid IN (' + articleids.join(',') + ')');
};


const SELECT_USER_LIST = 'SELECT ' +
	'comment.commentid,' +
	'comment.userid,' +
	'comment.user_nickname,' +
	'user.nickname as user_current_nickname,' +
	'comment.user_email,' +
	'user.email as user_current_email,' +
	'comment.articleid,' +
	'article.title as article_title,' +
	'article.title_en as article_title_en,' +
	'comment.content,' +
	'comment.pubtime,' +
	'comment.ip,' +
	'comment.state' +
' FROM comment' +
' LEFT JOIN user ON comment.userid = user.userid' +
' LEFT JOIN article ON comment.articleid = article.articleid';

exports.list = (params, pageSize, page) => {
	let sql = SELECT_USER_LIST;

	const whereStr = [], whereParams = [];
	if (params) {
		// 文章id
		if (params.articleid != null) {
			whereStr.push('comment.articleid = ?');
			whereParams.push(params.articleid);
		}
		// 文章标题
		if (params.title != null) {
			whereStr.push('LOCATE(?, article.title) > 0');
			whereParams.push(params.title);
		}
		// 状态
		if (params.state != null) {
			whereStr.push('comment.state = ?');
			whereParams.push(params.state);
		}
	}
	if (whereStr.length) { sql += ' WHERE ' + whereStr.join(' AND '); }

	sql += ' ORDER BY comment.pubtime ASC';

	return db.dataPaging(sql, {
		page: page,
		pageSize: pageSize,
		params: whereParams
	});
};


exports.getTotalPendingReviews = () => {
	return db.query(
		'SELECT COUNT(*) AS total FROM comment WHERE state = 0'
	).then((result) => {
		return result[0].total;
	});
};


exports.getTotalCommentsAfterTime = (time, ip) => {
	return db.query(
		'SELECT COUNT(*) AS total FROM comment WHERE pubtime >= ? AND IP = ?',
		[time, ip]
	).then((result) => {
		return result[0].total;
	});
};