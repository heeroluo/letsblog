const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const koaRespond = require('koa-respond');
const consola = require('consola');
const requireDir = require('require-dir');
const { Nuxt, Builder } = require('nuxt');
const serverConfig = require('../app.config').server;

const app = new Koa();
const host = serverConfig.host;
const port = serverConfig.port;

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js');
config.dev = !(app.env === 'production');


function initAPIRouter(app, prefix, dir, isUserRouter) {
	const router = new Router({ prefix });
	router.use(koaBody());
	router.use(koaRespond());

	// 获取当前用户
	const userBLL = require('./bll/user');
	router.use(async(ctx, next) => {
		const username = ctx.cookies.get('username');
		const password = ctx.cookies.get('password');

		let user;
		if (username && password) {
			user = await userBLL.readByUsernameAndPassword(username, password || '');
		}

		ctx.request.user = user;

		if (isUserRouter && !user) {
			const status = 403;
			ctx.send(status, {
				status,
				message: '请先登录'
			});
		} else {
			await next();
		}
	});

	const apiFiles = requireDir(dir, {
		recursively: false
	});

	Object.keys(apiFiles).forEach((filename) => {
		const file = apiFiles[filename];

		Object.keys(file).forEach((key) => {
			let config = file[key];
			if (typeof config === 'function') {
				config = {
					middleware: config
				};
			}
			config.verb = config.verb || 'get';
			router[config.verb](
				[filename, key].join('/').replace(/\/{2,}/, '/'),
				async(ctx) => {
					let data, status = 200, message;
					try {
						data = await config.middleware(ctx);
					} catch (e) {
						status = e.statusCode || 500;
						message = e.message;
					}
					ctx.send(200, {
						status: 200,
						message,
						data
					});
				}
			);
		});
	});

	app.use(router.routes()).use(router.allowedMethods());
}

initAPIRouter(app, '/api/', './api', false);
initAPIRouter(app, '/api/admin/', './api/admin', true);


async function start() {
	// Instantiate nuxt.js
	const nuxt = new Nuxt(config);

	// Build in development
	if (config.dev) {
		const builder = new Builder(nuxt);
		await builder.build();
	}

	app.use((ctx) => {
		ctx.status = 200; // koa defaults to 404 when it sees that status is unset

		return new Promise((resolve, reject) => {
			ctx.res.on('close', resolve);
			ctx.res.on('finish', resolve);
			nuxt.render(ctx.req, ctx.res, (promise) => {
				// nuxt.render passes a rejected promise into callback on error.
				promise.then(resolve).catch(reject);
			});
		});
	});

	app.listen(port, host);
	consola.ready({
		message: `Server listening on http://${host}:${port}`,
		badge: true
	});
}

start();