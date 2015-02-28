/*!
 * LetsBlog
 * Data access layer of user group (2015-02-08T16:07:02+0800)
 * Released under MIT license
 */

'use strict';

var db = require('./_db');


exports.create = function(userGroup, callback) {
	db.query('INSERT INTO usergroup SET ?', userGroup, callback);
};

exports.update = function(userGroup, groupid, callback) {
	db.query('UPDATE usergroup SET ? WHERE groupid = ?', [userGroup, groupid], callback);
};

exports.delete = function(groupid, callback) {
	db.query('DELETE FROM usergroup WHERE groupid = ?', [groupid], callback);
};

exports.list = function(callback) {
	db.query('SELECT * FROM usergroup', callback);
};