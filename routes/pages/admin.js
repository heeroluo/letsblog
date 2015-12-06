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
	util.each(mainRoutes, function(subRoutes, subPath) {
		var myPath = mainPath;
		if (subPath !== '__') { myPath += '__' + subPath; }

		exports[myPath] = subRoutes;
	});
});