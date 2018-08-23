!function(global) {
	'use strict';

	var md5Map = global.md5Map;

	global.bowljs.config({
		basePath: global.ASSET_URL_PREFIX || '/assets/',
		debug: false,
		map: [
			function(url) {
				if (md5Map && /\.raw\.js$/.test(url.pathname)) {
					url.pathname = url.pathname.replace(
						/(\/assets\/)(.+)$/,
						function(wholePath, assetsDirname, restPath) {
							if (md5Map[restPath]) {
								return assetsDirname + restPath.replace(/\.\w+$/, function(extName) {
									return '.' + md5Map[restPath] + extName;
								});
							} else {
								return wholePath;
							}
						}
					);
				}
			}
		]
	});
}(window);