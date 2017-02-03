!function(global) { 'use strict';

global.bowljs.config({
	basePath: '/assets/',
	debug: false,
	map: [
		function(url) {
			var extname = '';
			url.pathname = url.pathname.replace( /(\.\w+)+$/, function(match) {
				extname = match;
				return '';
			});

			switch (extname) {
				case '.xtpl':
					extname = '.xtpl.js';
					break;

				case '.js':
					extname = '.mod.js';
					break;
			}
			url.pathname += extname;
		}
	]
});

}(window);