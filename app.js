/*!
 * LetsBlog
 * Express setup
 */

'use strict';

const path = require('path');
const express = require('express');
// const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const appConfig = require('./config');

const app = express();
app.set('env', appConfig.nodeEnv);
app.set('trust proxy', true);

// 配置express
if (appConfig.express) {
	Object.keys(appConfig.express).forEach((key) => {
		app.set(key, appConfig.express[key]);
	});
}

// 初始化XTemplate引擎
const xTpl = require('./lib/xtpl');
xTpl.express(app, {
	rootPath: path.join(__dirname, 'public', 'assets')
});

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// avoid 404
app.use('/favicon.ico', function(req, res) {
	res.end();
});

app.use(logger('dev'));

// 上传文件（文章附件）
app.use('/upload', express.static(appConfig.uploadDir, appConfig.static));

// CKEditor
app.use('/ckeditor', express.static(
	path.join(__dirname, 'ckeditor'), appConfig.static
));

// 静态文件
const assetConfig = require('./asset-config');
// assetConfig为null时，表示未构建（开发环境）
const isLocalDev = assetConfig == null;
// 以下情况都要在Express中处理静态资源:
//   未构建
//   isStaticServer为true时，表示非开发环境下也使用Express作为静态资源服务器
if (isLocalDev || appConfig.isStaticServer) {
	// 非开发环境用~public存放构建后的静态资源
	const staticPath = path.join(
		__dirname,
		isLocalDev ? 'public' : '~public'
	);
	// 开发环境才需要预处理特殊静态资源的中间件
	if (isLocalDev) {
		app.use(require('./lib/assets-handler')(staticPath));
	}
	// 处理静态文件的中间件
	app.use(express.static(staticPath, appConfig.static));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// 增加获取实体类工具函数
app.use(function(req, res, next) {
	req.getEntity = function(entityName, type) {
		return require('./entity/' + entityName).createEntity(this, type);
	};
	next();
});

// 初始化路由
require('./routes/init')(express, app);

module.exports = app;