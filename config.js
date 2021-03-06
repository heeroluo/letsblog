const argvs = require('minimist')(process.argv.slice(2));

const isProd = argvs.prod !== false;
[argvs.env, process.env.NODE_ENV].some((item) => {
	// 统一环境写法
	item = {
		'development': 'dev',
		'pre-release': 'pre',
		'production': 'prod'
	}[item] || item;

	if (['dev', 'test', 'pre', 'prod'].indexOf(item) !== -1) {
		process.env.NODE_ENV = isProd ? 'production' : 'development';
		process.env.BACK2FRONT_ENV = item;
		return true;
	}
});


const path = require('path');

module.exports = {
	// 环境
	env: process.env.BACK2FRONT_ENV,
	nodeEnv: process.env.NODE_ENV,

	// 占用的端口
	port: 3000,

	// 本应用发布后是否作为静态文件服务器
	isStaticServer: true,

	// 静态文件设置
	static: {
		maxAge: isProd ? 30 * 24 * 60 * 60 * 1000 : 0
	},

	// 前后端同构的XTemplate指令模块（路径相对于 lib/xtpl.js）
	xTplCommands: '../public/assets/xtpl/commands',

	// 上传文件目录
	uploadDir: path.resolve('./upload'),

	// 编辑器内容区CSS
	contentCSS: path.resolve('public/contentCSS.css'),

	// 数据库配置
	database: {
		host: 'localhost',
		port: 3306,
		user: 'root',
		password: '12345',
		database: 'letsblog'
	}
};