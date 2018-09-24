/*!
 * LetsBlog
 * Data access layer of user
 * Released under MIT license
 */

'use strict';

const db = require('./_db');


exports.create = (user) => {
	return db.query('INSERT INTO user SET ?', user);
};


exports.readByUserId = (userid) => {
	return db.query('SELECT * FROM user WHERE userid = ? LIMIT 1', userid);
};

exports.readByUsername = function(username, password) {
	let sql = 'SELECT * FROM user WHERE username = ?';
	const params = [username];

	// 参数个数大于1个时，表示有传password
	if (arguments.length > 1) {
		sql += ' AND password = ?';
		params.push(password);
	}
	sql += ' LIMIT 1';

	return db.query(sql, params);
};


exports.update = (user, userid) => {
	return db.query('UPDATE user SET ? WHERE userid = ?', [user, userid]);
};

exports.updateActivity = (activity, lastip, userid) => {
	return db.query(
		'UPDATE user SET lastactivity = ?, lastip = ? WHERE userid = ?',
		[activity, lastip, userid]
	);
};

exports.updatePassword = (password, username) => {
	return db.query(
		'UPDATE user SET password = ? WHERE username = ?',
		[password, username]
	);
};


exports.delete = (userids) => {
	return db.query('DELETE FROM user WHERE userid IN (' + userids.join(',') + ')');
};


exports.findByName = (username, nickname) => {
	let sql = 'SELECT * FROM user';
	const whereStr = [];
	const params = [];
	[username, nickname].forEach((name) => {
		if (name) {
			whereStr.push('username = ?');
			whereStr.push('nickname = ?');
			params.push(name);
			params.push(name);
		}
	});
	if (whereStr.length) { sql += ' WHERE ' + whereStr.join(' OR '); }

	return db.query(sql, params);
};


const SELECT_USER_LIST = 'SELECT ' +
	'user.userid,' +
	'user.username, ' +
	'user.groupid,' +
	'usergroup.groupname,' +
	'user.nickname,' +
	'user.email,' +
	'user.regtime,' +
	'user.lastactivity,' +
	'user.lastip,' +
	'user.totalarticles,' +
	'user.totalcomments' +
' FROM user' +
' LEFT JOIN usergroup ON user.groupid = usergroup.groupid';

exports.list = (params, pageSize, page) => {
	let sql = SELECT_USER_LIST;

	const whereStr = [], whereParams = [];
	if (params) {
		if (params.groupid) {
			whereStr.push('user.groupid = ?');
			whereParams.push(params.groupid);
		}
		if (params.name) {
			whereStr.push('(LOCATE(?, user.username) > 0 || LOCATE(?, user.nickname) > 0)');
			whereParams.push(params.name);
			whereParams.push(params.name);
		}
	}
	if (whereStr.length) { sql += ' WHERE ' + whereStr.join(' AND '); }

	sql += ' ORDER BY user.userid DESC';

	return db.dataPaging(sql, {
		page: page,
		pageSize: pageSize,
		params: whereParams
	});
};