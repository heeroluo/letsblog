/*!
 * LetsBlog
 * Data access layer of options
 * Released under MIT license
 */

'use strict';

var db = require('./_db');


exports.list = function() {
	return db.query('SELECT * FROM options LIMIT 1');
};

exports.update = function(options) {
	return db.query('UPDATE options SET ?', options);
};