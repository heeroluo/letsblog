/*!
 * LetsBlog
 * Data access layer of user group
 * Released under MIT license
 */

'use strict';

const db = require('./_db');


exports.create = (userGroup) => {
	return db.query('INSERT INTO usergroup SET ?', userGroup);
};

exports.update = (userGroup, groupid) => {
	return db.query('UPDATE usergroup SET ? WHERE groupid = ?', [userGroup, groupid]);
};

exports.delete = (groupid) => {
	return db.query('DELETE FROM usergroup WHERE groupid = ?', [groupid]);
};

exports.list = () => {
	return db.query('SELECT * FROM usergroup');
};