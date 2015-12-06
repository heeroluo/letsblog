/*!
 * LetsBlog
 * Route of homepage
 * Released under MIT license
 */

'use strict';

var util = require('../../lib/util');


exports.__ = util.extend(
	{ template: 'article/list' },
	require('./article').list,
	{ pathPattern: '/' }
);