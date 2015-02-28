/*!
 * LetsBlog
 * Data access layer of link (2015-02-08T16:06:11+0800)
 * Released under MIT license
 */

'use strict';

var db = require('./_db');


exports.create = function(link, callback) {
	db.query('INSERT INTO link SET ?', link, callback);
};

exports.update = function(link, linkid, callback) {
	db.query('UPDATE link SET ? WHERE linkid = ?', [link, linkid], callback);
};

exports.delete = function(linkid, callback) {
	db.query('DELETE FROM link WHERE linkid = ?', linkid, callback);
};

exports.list = function(callback) {
	db.query('SELECT * FROM link ORDER BY weight DESC', callback);
};