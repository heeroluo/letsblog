/*!
 * LetsBlog
 * Route of homepage
 * Released under MIT license
 */

'use strict';


exports['/'] = Object.assign(
	{ template: 'article/list/list' },
	require('./article').list,
	{ pathPattern: '/' }
);