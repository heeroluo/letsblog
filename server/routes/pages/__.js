/*!
 * LetsBlog
 * 首页路由
 * Released under MIT license
 */

'use strict';


exports['/'] = Object.assign(
	{ template: 'article/list/list' },
	require('./article').list,
	{ pathPattern: '/' }
);