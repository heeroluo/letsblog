var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

// 配置express
var config = require('./config');
if (config && config.express) {
	for (var c in config.express) {
		app.set(c, config.express[c]);
	}
}

var XTemplate = require('xtemplate'), xtpl = require('xtpl');
XTemplate.addCommand('json', function(scope, option) {
	return JSON.stringify(option.params[0]);
});
xtpl.config({ XTemplate: XTemplate });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'xtpl');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// 增加文件上传支持
var multer  = require('multer');
app.use(multer({
	dest: './public/upload/',
	rename: function (fieldname, filename) {
		var now = new Date();
		// 重命名为 年+月+日+时+分+秒+5位随机数
		return now.getFullYear() +
			( '0' + (now.getMonth() + 1) ).slice(-2) +
			( '0' + now.getDate() ).slice(-2) +
			( '0' + now.getHours() ).slice(-2) +
			( '0' + now.getMinutes() ).slice(-2) +
			( '0' + now.getSeconds() ).slice(-2) +
			parseInt(10000 + Math.random() * 90000);
	}
}));

// 静态文件及其过期时间
app.use(express.static(path.join(__dirname, 'public'), {
	maxAge: config.staticExpires * 60 * 1000
}));

// iisnode默认不保留REMOTE_ADDR，如果要保留，需添加<iisnode promoteServerVars="REMOTE_ADDR" />
if (config.iisnode) {
	app.use(function(req, res, next) {
		Object.defineProperty(req, 'ip', {
		    get: function() { return this.headers['REMOTE_ADDR'] || this.headers['x-iisnode-REMOTE_ADDR']; }
		});
		next();
	});
}

// 增加获取实体类工具函数
app.use(function(req, res, next) {
	req.getEntity = function(entityName, type) {
		return require('./entity/' + entityName).createEntity(this, type);
	};
	next();
});

// 避免请求图标时出错
app.use('/favicon.ico', function(req, res) {
	res.end();
});

// 路由
!function() {
	var routeHandler = require('./routes/routehandler'),
		routeRules = require('./routes');

	routeRules.forEach(function(rule) {
		var router = express.Router();

		rule.routes.forEach(function(route) {
			if (route.template || route.resType) {
				var callback = function(req, res, next) {
					if (route.resType === 'json') {
						res.routeHandler = new routeHandler.JSONRouteHandler();
					} else if (route.resType === 'jsonp') {
						res.routeHandler = new routeHandler.JSONPRouteHandler();
					} else {
						res.routeHandler = new routeHandler.BasicRouteHandler(route.template);
					}
					if (route.data) { res.routeHandler.setData(route.data); }
					next();
				};

				if (route.path) {
					router[route.verb || 'get'](route.path, callback);
				} else {
					router.use(callback);
				}
			}
		});

		app.use(rule.basePath, router);
	});

	require('./routes').forEach(function(rule) {
		var router = express.Router();

		rule.routes.forEach(function(route) {
			var callbacks = [ ];

			if (route.callback) {
				if (Array.isArray(route.callback)) {
					callbacks = callbacks.concat(route.callback)
				} else {
					callbacks.push(route.callback);
				}
			}

			if (route.template || route.resType) {
				callbacks.push(function(req, res, next) {
					if (res.routeHandler) {
						var title = res.routeHandler.getData('title');
						if (title && Array.isArray(title)) {
							res.routeHandler.setData('title', title.join(' | '));
						}
						var keywords = res.routeHandler.getData('keywords');
						if (keywords && Array.isArray(keywords)) {
							res.routeHandler.setData('keywords', keywords.join(','));
						}
						res.routeHandler.render(res);
					} else {
						next();
					}
				});
			}

			callbacks.forEach(function(callback) {
				if (route.path) {
					router[route.verb || 'get'](route.path, callback);
				} else {
					router.use(callback);
				}
			});
		});

		app.use(rule.basePath, router);
	});

	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;

		next(err);
	});

	// 异常处理
	var isDevEnv = app.get('env') !== 'production';
	app.use(routeHandler.createErrorRouteHandler(isDevEnv));
}();


module.exports = app;