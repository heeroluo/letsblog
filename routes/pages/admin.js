/*!
 * LetsBlog
 * Merge management page routes
 * Released under MIT license
 */

'use strict';

var requireDir = require('require-dir'),
	util = require('../../lib/util'),
	adminRoutes = requireDir('./admin');


util.each(adminRoutes, function(mainRoutes, mainPath) {
	util.each(mainRoutes, function(route, subPath) {
		var myPath = mainPath;
		if (subPath !== '/') { myPath += '/' + subPath; }

		exports[myPath] = route;
	});
});