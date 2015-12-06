/*!
 * LetsBlog
 * Data access layer of category
 * Released under MIT license
 */

'use strict';

var db = require('./_db');


exports.create = function(category) {
	return db.query('INSERT INTO category SET ?', category);
};

exports.update = function(category, categoryid) {
	return db.query('UPDATE category SET ? WHERE categoryid = ?', [category, categoryid]);
};

exports.delete = function(categoryid) {
	return db.query('DELETE FROM category WHERE categoryid = ?', categoryid);
};

exports.list = function(callback) {
	return db.query('SELECT * FROM category ORDER BY weight DESC');
};