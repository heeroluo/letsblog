/*!
 * LetsBlog
 * Merge management page routes
 * Released under MIT license
 */

'use strict';

const requireDir = require('require-dir');
const util = require('../../lib/util');
const pageType = require('../page-type');


util.each(requireDir('./admin-api'), (mainRoutes, mainPath) => {
	util.each(mainRoutes, (route, subPath) => {
		let myPath = mainPath;
		if (subPath !== '/') { myPath += '/' + subPath; }

		if (typeof route === 'function' || Array.isArray(route)) {
			route = { callbacks: route };
		}
		route.resType = 'json';
		route.callbacks = pageType.admin(route.callbacks);

		exports[myPath] = route;
	});
});