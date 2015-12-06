/*!
 * LetsBlog
 * Data access layer of link
 * Released under MIT license
 */

'use strict';

var db = require('./_db');


exports.create = function(link) {
	return db.query('INSERT INTO link SET ?', link);
};

exports.update = function(link, linkid) {
	return db.query('UPDATE link SET ? WHERE linkid = ?', [link, linkid]);
};

exports.delete = function(linkid) {
	return db.query('DELETE FROM link WHERE linkid = ?', linkid);
};

exports.list = function() {
	return db.query('SELECT * FROM link ORDER BY weight DESC');
};