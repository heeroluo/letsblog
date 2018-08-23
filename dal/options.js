/*!
 * LetsBlog
 * Data access layer of options
 * Released under MIT license
 */

'use strict';

const db = require('./_db');


exports.list = () => {
	return db.query('SELECT * FROM options LIMIT 1');
};

exports.update = (options) => {
	return db.query('UPDATE options SET ?', options);
};