/*!
 * LetsBlog
 * Data access layer of category (2015-02-08T16:20:14+0800)
 * Released under MIT license
 */

'use strict';

var db = require('./_db');


exports.create = function(category, callback) {
	db.query('INSERT INTO category SET ?', category, callback);
};

exports.update = function(category, categoryid, callback) {
	db.query('UPDATE category SET ? WHERE categoryid = ?', [category, categoryid], callback);
};

exports.delete = function(categoryid, callback) {
	db.query('DELETE FROM category WHERE categoryid = ?', categoryid, callback);
};

exports.list = function(callback) {
	db.query('SELECT * FROM category ORDER BY weight DESC', callback);
};