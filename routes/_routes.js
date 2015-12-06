/*!
 * LetsBlog
 * Public routes (2015-10-06T10:58:34+0800)
 * Released under MIT license
 */

'use strict';

var async = require('async'),
	util = require('../lib/util'),
	routeHandler = require('./routehandler'),
	userModel = require('../entity/user'),
	userBLL = require('../bll/user'),
	userGroupBLL = require('../bll/usergroup'),
	optionsBLL = require('../bll/options'),
	categoryBLL = require('../bll/category'),
	linkBLL = require('../bll/link');


// 每个页面都要经过此流程，初始化基本的数据和函数
exports.basicPage = function(req, res, next) {
	// 指定一个默认的routeHandler
	res.routeHandler = res.routeHandler || new routeHandler.BasicRouteHandler();

	var user;

	return userBLL.readByUsernameAndPassword(
		req.cookies.username,
		req.cookies.password
	).then(function(result) {
		user = result;
	}).catch(function(e) {
		// error的情况下表示没有登录
	}).then(function() {
		// 如果用户未登录或不存在，则生成一个访客对象
		user = user || userModel.createEntity({
			userid: 0,
			username: '',
			groupid: 2
		});

		return userGroupBLL.read(user.groupid);
	}).then(function(result) {
		if (result) {
			user.group = result;
			req.currentUser = user;

			var userData = user.toPureData();
			// 删除较为敏感的密码信息，防止误输出
			delete userData.password;

			if (res.routeHandler.type === 'basic') {
				res.routeHandler.setData('currentUser', userData);
			}

			if (user.userid) {
				// 更新用户最后在线状态
				return userBLL.updateActivity(req.ip, user.userid);
			}
		} else {
			throw util.createError('用户组不存在');
		}
	});
};


// 前台页面经过此流程
exports.frontPage = function(req, res, next) {
	res.routeHandler.setData('categoryid', -1);

	async.parallel([function(callback) {
		// 加载网站设置
		optionsBLL.read(function(err, result) {
			if (!err) {
				if (!result) {
					err = util.createError('网站设置丢失', 500);
				} else if (!result.isopen) {
					err = util.createError(result.tipstext || '网站已关闭');
				} else {
					if (res.routeHandler.type === 'basic') {
						res.routeHandler.setData({
							title: [result.sitename],
							keywords: result.keywords.split(/\s*,\s*/),
							description: result.description,
							options: result,
							currentYear: (new Date()).getFullYear()
						});
					}
				}
			}
			callback(err);
		});
	}, function(callback) {
		// 加载可见分类
		categoryBLL.list(function(err, result) {
			if (res.routeHandler.type === 'basic') {
				res.routeHandler.setData('categoryList', result);
			}
			callback(err);
		}, 1);
	}, function(callback) {
		// 加载可见链接
		linkBLL.list(function(err, result) {
			if (res.routeHandler.type === 'basic') {
				res.routeHandler.setData('linkList', result);
			}
			callback(err);
		}, 1);
	}], next);
};


// 后台管理页面经过此流程
exports.adminPage = function(req, res, next) {
	if (req.currentUser.userid) {
		next();
	} else {
		res.redirect(
			'/user/login' +
			'?referrer=' + encodeURIComponent(req.originalUrl) +
			'&msg=' + encodeURIComponent('请先登录')
		);
	}
};