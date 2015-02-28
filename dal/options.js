/*!
 * LetsBlog
 * Data access layer of options (2015-02-08T16:05:43+0800)
 * Released under MIT license
 */

'use strict';

var db = require('./_db');


exports.list = function(callback) {
	db.query('SELECT * FROM options LIMIT 1', callback);
};

exports.update = function(options, callback) {
	db.query('UPDATE options SET ?', options, callback);
};