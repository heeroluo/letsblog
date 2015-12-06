/*!
 * LetsBlog
 * Data access layer of user group
 * Released under MIT license
 */

'use strict';

var db = require('./_db');


exports.create = function(userGroup) {
	return db.query('INSERT INTO usergroup SET ?', userGroup);
};

exports.update = function(userGroup, groupid) {
	return db.query('UPDATE usergroup SET ? WHERE groupid = ?', [userGroup, groupid]);
};

exports.delete = function(groupid) {
	return db.query('DELETE FROM usergroup WHERE groupid = ?', [groupid]);
};

exports.list = function() {
	return db.query('SELECT * FROM usergroup');
};