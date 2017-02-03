/*!
 * LetsBlog
 * Route of homepage
 * Released under MIT license
 */

'use strict';

var util = require('../../lib/util');


exports['/'] = util.extend(
	{ template: 'article/list/list' },
	require('./article').list,
	{ pathPattern: '/' }
);