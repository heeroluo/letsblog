/*!
 * LetsBlog
 * All routes (2015-05-18T15:04:11+0800)
 * Released under MIT license
 */

'use strict';

var pubRoutes = require('./_routes'),
	admin_optionsRoutes = require('./admin/options'),
	admin_linkRoutes = require('./admin/link'),
	admin_userGroupRoutes = require('./admin/usergroup'),
	admin_userRoutes = require('./admin/user'),
	admin_categoryRoutes = require('./admin/category'),
	admin_articleRoutes = require('./admin/article'),
	admin_commentRoutes = require('./admin/comment'),
	userRoutes = require('./user'),
	articleRoutes = require('./article'),
	commentRoutes = require('./comment');


module.exports = [
	{
		basePath: '*',
		routes: [{ verb: 'all', callback: pubRoutes.basicPage }]
	},

	{
		basePath: '/admin',
		routes: [{ verb: 'all', callback: pubRoutes.adminPage }]
	},

	{
		basePath: '/',
		routes: [{ path: '/', verb: 'all', callback: pubRoutes.frontPage }]
	},
	{
		basePath: '/article',
		routes: [{ verb: 'all', callback: pubRoutes.frontPage }]
	},
	{
		basePath: '/comment',
		routes: [{ verb: 'all', callback: pubRoutes.frontPage }]
	},


	{
		basePath: '/',
		routes: [{
			path: '/',
			template: 'article/list',
			callback: articleRoutes.list
		}]
	},

	{
		basePath: '/article',
		routes: [
			// 文章列表页
			{
				path: /\/list\/(\d+)(?:\/[a-z1-9\-]+)?$/,
				template: 'article/list',
				callback: articleRoutes.list
			},
			// 文章详情页
			{
				path: /\/detail\/(\d+)(?:\/[a-z1-9\-]+)?$/,
				template: 'article/detail',
				callback: articleRoutes.detail
			},
			// 增加文章查看次数
			{ path: '/view/:articleid', callback: articleRoutes.addViews }
		]
	},

	// 301 Redirect for SEO
	{
		basePath: '/Article',
		routes: [
			{
				path: '/List/:categoryid',
				callback: function(req, res, next) {
					res.redirect(301, '/article/list/' + req.params.categoryid);
				}
			},
			{
				path: '/Detail/:articleid',
				callback: function(req, res, next) {
					res.redirect(301, '/article/detail/' + req.params.articleid);
				}
			}
		]
	},

	{
		basePath: '/comment',
		routes: [
			// 发评论
			{
				path: '/create',
				verb: 'post',
				resType: 'json',
				callback: commentRoutes.create
			},
			// 读评论
			{
				path: '/list/:articleid',
				resType: 'json',
				callback: commentRoutes.list
			}
		]
	},


	// 后台首页
	{
		basePath: '/admin/home',
		routes: [{ path: '/', template: 'admin/home' }]
	},

	// 登录登出
	{
		basePath: '/user',
		routes: [
			// 登录
			{ path: '/login', template: 'user/login', callback: userRoutes.login },
			{
				path: '/login',
				verb: 'post',
				resType: 'jsonp',
				callback: userRoutes.login_post
			},
			// 登出
			{ path: '/logout', callback: userRoutes.logout }
		]
	},

	// 网站设置管理
	{
		basePath: '/admin/options',
		routes: [
			{
				path: '/update',
				template: 'admin/options-form',
				callback: admin_optionsRoutes.update
			},
			{
				path: '/update',
				verb: 'post',
				callback: admin_optionsRoutes.update_post
			}
		]
	},

	// 链接管理
	{
		basePath: '/admin/link',
		routes: [
			{
				path: '/create',
				template: 'admin/link-form',
				callback: admin_linkRoutes.create
			},
			{
				path: '/create',
				verb: 'post',
				callback: admin_linkRoutes.create_post
			},
			{
				path: '/update/:linkid',
				template: 'admin/link-form',
				callback: admin_linkRoutes.update
			},
			{
				path: '/update/:linkid',
				verb: 'post',
				callback: admin_linkRoutes.update_post
			},
			{
				path: '/list',
				template: 'admin/link-list',
				callback: admin_linkRoutes.list
			},
			{
				path: '/delete/:linkid',
				verb: 'post',
				resType: 'json',
				callback: admin_linkRoutes.delete_post
			}
		]
	},

	// 用户组管理
	{
		basePath: '/admin/usergroup',
		routes: [
			{
				path: '/create',
				template: 'admin/usergroup-form',
				callback: admin_userGroupRoutes.create
			},
			{
				path: '/create',
				verb: 'post',
				callback: admin_userGroupRoutes.create_post
			},
			{
				path: '/update/:groupid',
				template: 'admin/usergroup-form',
				callback: admin_userGroupRoutes.update
			},
			{
				path: '/update/:groupid',
				verb: 'post',
				callback: admin_userGroupRoutes.update_post
			},
			{
				path: '/list',
				template: 'admin/usergroup-list',
				callback: admin_userGroupRoutes.list
			},
			{
				path: '/delete/:groupid',
				verb: 'post',
				resType: 'json',
				callback: admin_userGroupRoutes.delete_post
			}
		]
	},

	// 用户管理
	{
		basePath: '/admin/user/',
		routes: [
			{
				path: '/create',
				template: 'admin/user-form',
				callback: admin_userRoutes.create
			},
			{
				path: '/create',
				verb: 'post',
				callback: admin_userRoutes.create_post
			},
			{
				path: '/update',
				template: 'admin/user-form',
				callback: admin_userRoutes.updateMyProfile
			},
			{
				path: '/update',
				verb: 'post',
				callback: admin_userRoutes.updateMyProfile_post
			},
			{
				path: '/update/:userid',
				template: 'admin/user-form',
				callback: admin_userRoutes.update
			},
			{
				path: '/update/:userid',
				verb: 'post',
				callback: admin_userRoutes.update_post
			},
			{
				path: '/password',
				template: 'admin/user-mypassword-form',
				callback: admin_userRoutes.updateMyPassword
			},
			{
				path: '/password',
				verb: 'post',
				callback: admin_userRoutes.updateMyPassword_post
			},
			{
				path: '/password/:username',
				template: 'admin/user-password-form',
				callback: admin_userRoutes.updatePassword
			},
			{
				path: '/password/:username',
				verb: 'post',
				callback: admin_userRoutes.updatePassword_post
			},
			{
				path: '/list',
				template: 'admin/user-list',
				callback: admin_userRoutes.list
			},
			{
				path: '/delete',
				verb: 'post',
				callback: admin_userRoutes.delete_post
			}
		]
	},

	// 分类管理
	{
		basePath: '/admin/category',
		routes: [
			{
				path: '/create',
				template: 'admin/category-form',
				callback: admin_categoryRoutes.create
			},
			{
				path: '/create',
				verb: 'post',
				callback: admin_categoryRoutes.create_post
			},
			{
				path: '/update/:categoryid',
				template: 'admin/category-form',
				callback: admin_categoryRoutes.update
			},
			{
				path: '/update/:categoryid',
				verb: 'post',
				callback: admin_categoryRoutes.update_post
			},
			{
				path: '/list',
				template: 'admin/category-list',
				callback: admin_categoryRoutes.list
			},
			{
				path: '/delete/:categoryid',
				verb: 'post',
				resType: 'json',
				callback: admin_categoryRoutes.delete_post
			}
		]
	},

	// 文章管理
	{
		basePath: '/admin/article',
		routes: [
			{
				path: '/create',
				template: 'admin/article-form',
				callback: admin_articleRoutes.create
			},
			{
				path: '/create',
				verb: 'post',
				resType: 'json',
				callback: admin_articleRoutes.create_post
			},
			{
				path: '/update/:articleid',
				template: 'admin/article-form',
				callback: admin_articleRoutes.update
			},
			{
				path: '/update/:articleid',
				verb: 'post',
				resType: 'json',
				callback: admin_articleRoutes.update_post
			},
			{
				path: '/list',
				template: 'admin/article-list',
				callback: admin_articleRoutes.list
			},
			{
				path: '/delete',
				verb: 'post',
				callback: admin_articleRoutes.delete_post
			},
			{
				path: '/upload',
				verb: 'post',
				resType: 'json',
				callback: admin_articleRoutes.upload_post
			}
		]
	},

	// 评论管理
	{
		basePath: '/admin/comment',
		routes: [
			{
				path: '/list',
				template: 'admin/comment-list',
				callback: admin_commentRoutes.list
			},
			{
				path: '/batch-post',
				verb: 'post',
				callback: admin_commentRoutes.batch_post
			},
			{
				path: '/totalpendingreviews',
				resType: 'json',
				callback: admin_commentRoutes.getTotalPendingReviews
			}
		]
	}
];