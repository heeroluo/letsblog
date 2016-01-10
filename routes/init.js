/*!
 * LetsBlog
 * Route initialize
 * Released under MIT license
 */

'use strict';


module.exports = function(express, app) {
	var Promise = require('bluebird'),
		requireDir = require('require-dir'),
		util = require('../lib/util'),
		routeHelper = require('./route-helper'),
		routes = requireDir('./pages');


	// 调用渲染的callback
	function render(req, res, next) {
		if (res.routeHelper) {
			if ( res.routeHelper.rendered() ) {
				res.end();
			} else {
				res.routeHelper.render(res);
			}
		} else {
			next();
		}
	}

	// 处理Promise实例
	function handlePromise(callback) {
		return function(req, res, next) {
			var result = callback.apply(this, arguments);
			if (result instanceof Promise) {
				// 注意这里不能写成 result.then(next, next)
				// 因为next一旦有参数就会被判定为出现异常
				result.then(function() {
					next();
				}, next);
			}
		};
	}

	util.each(routes, function(subRoutes, mainPath) {
		var router = express.Router();

		// 当前路由主路径
		mainPath = mainPath.replace(/__/g, '/');
		if (mainPath[0] !== '/') { mainPath = '/' + mainPath; }

		util.each(subRoutes, function(subRoute, subPath) {
			if ( typeof subRoute === 'function' || Array.isArray(subRoute) ) {
				subRoute = { callbacks: subRoute };
			} else {
				subRoute = util.extend({ }, subRoute);
			}
			if ( !Array.isArray(subRoute.callbacks) ) {
				subRoute.callbacks = [subRoute.callbacks];
			}
			// 增加对Promise实例的包装处理
			subRoute.callbacks = subRoute.callbacks.map(handlePromise);

			subRoute.callbacks.push(render);

			subRoute.path = subPath;

			var template, resType;
			if (!subRoute.resType || subRoute.resType === 'html') {
				resType = 'html';
				// 默认模板路径为 pages/路由主路径/路径子路径
				template = 'pages/' + (
					subRoute.template || (mainPath + '/' + subRoute.path)
				);
			} else {
				resType = subRoute.resType;
			}

			subRoute.path = subRoute.path.replace(/__/g, '/');
			if (subRoute.path[0] !== '/') { subRoute.path = '/' + subRoute.path; }

			subRoute.callbacks.unshift(function(req, res, next) {
				var RouteHelper;
				if (resType === 'json') {
					RouteHelper = routeHelper.JSONRouteHelper;
				} else {
					RouteHelper = routeHelper.HTMLRouteHelper;
				}

				res.routeHelper = new RouteHelper(template);

				next();
			});

			var verb = subRoute.verb || 'get', pathPattern = subRoute.pathPattern || subRoute.path;
			subRoute.callbacks.forEach(function(callback) {
				router[verb](pathPattern, callback);
			});
		});

		app.use(mainPath, router);
	});

	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;

		// XXX 404模板
		res.routeHelper = new routeHelper.HTMLRouteHelper();

		next(err);
	});

	// 异常处理
	var isDevEnv = app.get('env') !== 'production';
	app.use(function(err, req, res, next) {
		if (typeof err === 'string') { err = new Error(err); }

		err.status = err.status || 500;
		res.status(err.status);

		try {
			res.routeHelper.renderInfo(res, {
				status: 2,
				httpStatus: err.status,
				message: err.message || '',
				stack: isDevEnv ? err.stack : ''
			});
		} catch (e) {
			res.end();
			throw e;
		}
	});
};