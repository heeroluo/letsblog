/*!
 * LetsBlog
 * Data access layer of category
 * Released under MIT license
 */

'use strict';

const db = require('./_db');


exports.create = (category) => {
	return db.query('INSERT INTO category SET ?', category);
};

exports.update = (category, categoryid) => {
	return db.query('UPDATE category SET ? WHERE categoryid = ?', [category, categoryid]);
};

exports.delete = (categoryid) => {
	return db.query('DELETE FROM category WHERE categoryid = ?', categoryid);
};

exports.list = () => {
	return db.query('SELECT * FROM category ORDER BY weight DESC');
};