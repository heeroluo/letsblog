/*!
 * LetsBlog
 * Data access layer of link
 * Released under MIT license
 */

'use strict';

const db = require('./_db');


exports.create = (link) => {
	return db.query('INSERT INTO link SET ?', link);
};

exports.update = (link, linkid) => {
	return db.query('UPDATE link SET ? WHERE linkid = ?', [link, linkid]);
};

exports.delete = (linkid) => {
	return db.query('DELETE FROM link WHERE linkid = ?', linkid);
};

exports.list = () => {
	return db.query('SELECT * FROM link ORDER BY weight DESC');
};