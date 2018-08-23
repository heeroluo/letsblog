/*!
 * LetsBlog
 * Merge management page routes
 * Released under MIT license
 */

'use strict';

const requireDir = require('require-dir');
const util = require('../../lib/util');


util.each(requireDir('./admin'), (mainRoutes, mainPath) => {
	util.each(mainRoutes, (route, subPath) => {
		let myPath = mainPath;
		if (subPath !== '/') { myPath += '/' + subPath; }
		exports[myPath] = route;
	});
});