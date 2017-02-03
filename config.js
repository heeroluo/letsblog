var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
	// 环境
	env: env,

	// 服务端口
	port: 3000,

	// Express配置
	express: {
		'trust proxy': false
	},

	// 非开发环境时，是否把Express作为静态文件服务器
	isStaticServer: true,

	// 静态文件配置
	static: {
		maxAge: env === 'development'
			? 0
			: 3 * 24 * 60 * 60 * 1000
	},

	// 数据库配置
	database: {
		host: 'localhost',
		port: 3306,
		user: 'root',
		password: '12345',
		database: 'letsblog'
	}
};