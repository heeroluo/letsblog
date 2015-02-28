/*!
 * LetsBlog
 * Data access layer of user (2015-02-17T17:41:34+0800)
 * Released under MIT license
 */

'use strict';

var db = require('./_db');


exports.create = function(user, callback) {
	db.query('INSERT INTO user SET ?', user, callback);
};

exports.readByUserId = function(userid, callback) {
	db.query('SELECT * FROM user WHERE userid = ? LIMIT 1', userid, callback);
};

exports.readByUsername = function(username, password, callback) {
	// 重载
	if (typeof password === 'function') { callback = password; }

	var usePassword = arguments.length >= 3;

	var sql = 'SELECT * FROM user WHERE username = ?', params = [username];
	if (usePassword) {
		sql += ' AND password = ?';
		params.push(password);
	}
	sql += ' LIMIT 1';

	db.query(sql, params, callback);
};

exports.update = function(user, userid, callback) {
	db.query('UPDATE user SET ? WHERE userid = ?', [user, userid], callback);
};

exports.updateActivity = function(activity, lastip, userid) {
	db.query(
		'UPDATE user SET lastactivity = ?, lastip = ? WHERE userid = ?',
		[activity, lastip, userid], null
	);
};

exports.updatePassword = function(password, username, callback) {
	db.query(
		'UPDATE user SET password = ? WHERE username = ?',
		[password, username], callback
	);
};

exports.delete = function(userids, callback) {
	db.query('DELETE FROM user WHERE userid IN (' + userids.join(',') + ')', callback);
};

exports.findByName = function(username, nickname, callback) {
	var sql = 'SELECT * FROM user', whereStr = [ ], params = [ ];
	[username, nickname].forEach(function(name) {
		if (name) {
			whereStr.push('username = ?');
			whereStr.push('nickname = ?');
			params.push(name);
			params.push(name);
		}
	});
	if (whereStr.length) { sql += ' WHERE ' + whereStr.join(' OR '); }

	db.query(sql, params, callback);
};


var SELECT_USER_LIST = 'SELECT ' +
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

exports.list = function(params, pageSize, page, callback) {
	var sql = SELECT_USER_LIST;

	var whereStr = [ ], whereParams = [ ];
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

	db.dataPaging(sql, {
		page: page,
		pageSize: pageSize,
		params: whereParams,
		callback: callback
	});
};