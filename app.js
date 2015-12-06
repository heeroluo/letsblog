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

var XTemplate = require('xtemplate'), xtpl = require('./lib/xtpl');
XTemplate.addCommand('json', function(scope, option) {
	return JSON.stringify(option.params[0]);
});
XTemplate.addCommand('exists', function(scope, option) {
	var obj = option.params[0], result = obj != null;
	if (result) {
		if ( Array.isArray(obj) ) {
			result = obj.length > 0;
		} else if (typeof obj === 'string') {
			result = obj.trim() !== '';
		}
	}
	return result;
});
xtpl.config({ XTemplate: XTemplate });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('xtpl', xtpl.__express);
app.set('view engine', 'xtpl');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// 静态文件及其过期时间
app.use(express.static(path.join(__dirname, 'public'), {
	maxAge: config.staticExpires * 60 * 1000
}));

// iisnode默认不保留REMOTE_ADDR，如果要保留，需添加<iisnode promoteServerVars="REMOTE_ADDR" />
if (config.iisnode) {
	app.use(function(req, res, next) {
		Object.defineProperty(req, 'ip', {
		    get: function() {
		    	return this.headers['REMOTE_ADDR'] || this.headers['x-iisnode-remote_addr'];
		    }
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

// 初始化路由
require('./routes/init')(express, app);


module.exports = app;