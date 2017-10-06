/*!
 * LetsBlog
 * Pre-execute functions of different page types
 * Released under MIT license
 */

'use strict';

var Promise = require('bluebird');
var packageJSON = require('../package');
var util = require('../lib/util');
var userModel = require('../entity/user');
var optionsBLL = require('../bll/options');
var categoryBLL = require('../bll/category');
var linkBLL = require('../bll/link');
var userGroupBLL = require('../bll/usergroup');
var userBLL = require('../bll/user');


// 在数组最前面插入元素
function prepend(elt, arr) {
	if (Array.isArray(arr)) {
		arr = arr.slice();
	} else if (arr) {
		arr = [arr];
	} else {
		arr = [ ];
	}

	if (elt) { arr.unshift(elt); }

	return arr;
}
exports.prepend = prepend;


// 基础页面
function basicPage(callbacks) {
	return prepend(function(req, res) {
		var user;

		// 版本号
		if (res.routeHelper.type() === 'html') {
			res.routeHelper.viewData('version', packageJSON.version);
		}

		return userBLL.readByUsernameAndPassword(
			req.cookies.username,
			req.cookies.password
		).then(function(result) {
			user = result;
		}).catch(function(e) {
			// error的情况下表示没有登录
			// 无需处理异常
		}).then(function() {
			// 如果用户未登录或不存在，则创建一个访客对象
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

				if (res.routeHelper.type() === 'html') {
					res.routeHelper.viewData('currentUser', userData);
				}

				if (user.userid) {
					// 更新用户最后在线状态
					return userBLL.updateActivity(req.ip, user.userid);
				}
			} else {
				return util.createError('用户组不存在');
			}
		});
	}, callbacks);
}
exports.basic = basicPage;


// 前台页面
function normalPage(callbacks) {
	return basicPage(
		prepend(function(req, res) {
			var isHTMLPage = res.routeHelper.type() === 'html';

			if (isHTMLPage) {
				// 标示当前所在分类（默认不在任何分类）
				res.routeHelper.viewData('categoryid', -1);
			}

			var tasks = [
				// 加载网站配置
				optionsBLL.read().then(function(result) {
					if (!result) {
						err = util.createError('网站配置丢失', 500);
					} else if (!result.isopen) {
						err = util.createError(result.tipstext || '网站已关闭');
					} else {
						if (isHTMLPage) {
							res.routeHelper.appendTitle(result.sitename);
							res.routeHelper.appendKeywords(result.keywords.split(/\s*,\s*/));
							res.routeHelper.viewData({
								description: result.description,
								currentOptions: result
							});
						}
					}
				})
			];

			if (isHTMLPage) {
				tasks.push(
					// 加载可见分类
					categoryBLL.list(1).then(function(result) {
						res.routeHelper.viewData('categoryList', result);
					}),

					// 加载可见链接
					linkBLL.list(1).then(function(result) {
						res.routeHelper.viewData('linkList', result);
					})
				);
			}

			return Promise.all(tasks);
		}, callbacks)
	);
}
exports.normal = normalPage;


// 管理后台页面
function adminPage(callbacks) {
	return basicPage(
		prepend(function(req, res) {
			if (res.routeHelper.type() === 'html') {
				res.routeHelper.appendTitle('LetsBlog后台管理系统');
			}
			if (!req.currentUser.userid) {
				res.redirect(
					'/user/login' +
					'?referrer=' + encodeURIComponent(req.originalUrl) +
					'&msg=' + encodeURIComponent('请先登录')
				);
				return true;
			}
		}, callbacks)
	);
}
exports.admin = adminPage;