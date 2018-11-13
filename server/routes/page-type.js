/*!
 * LetsBlog
 * Pre-execute functions of different page types
 * Released under MIT license
 */

'use strict';

const packageJSON = require('../../package');
const util = require('../lib/util');
const optionsBLL = require('../bll/options');
const categoryBLL = require('../bll/category');
const linkBLL = require('../bll/link');
const userGroupBLL = require('../bll/usergroup');
const userBLL = require('../bll/user');


// 在数组最前面插入元素
const prepend = exports.prepend = function(elt, arr) {
	if (Array.isArray(arr)) {
		arr = arr.slice();
	} else if (arr) {
		arr = [arr];
	} else {
		arr = [];
	}

	if (elt) { arr.unshift(elt); }

	return arr;
};


// 基础页面
const basicPage = exports.basic = function(callbacks) {
	return prepend(async(req, res) => {
		// 版本号
		if (res.routeHelper.type() === 'html') {
			res.routeHelper.viewData('version', packageJSON.version);
		}

		let user;
		const username = req.cookies.username;
		const password = req.cookies.password;
		if (username && password) {
			try {
				user = await userBLL.readByUsernameAndPassword(
					username,
					password
				);
			} catch (e) {
				// error的情况下表示没有登录
				// 无需处理异常
			}
		}

		if (!user) {
			user = {
				userid: 0,
				username: '',
				groupid: 2
			};
			user.usergroup = await userGroupBLL.read(user.groupid);
		}

		// 删除较为敏感的密码信息，防止误输出
		delete user.password;

		req.currentUser = user;

		if (res.routeHelper.type() === 'html') {
			res.routeHelper.viewData('currentUser', user);
		}

		if (user.userid) {
			// 更新用户最后在线状态
			await userBLL.updateActivity(req.ip, user.userid);
		}
	}, callbacks);
};


// 前台页面
exports.normal = function(callbacks) {
	return basicPage(
		prepend(async(req, res) => {
			const isHTMLPage = res.routeHelper.type() === 'html';

			if (isHTMLPage) {
				// 标示当前所在分类（默认不在任何分类）
				res.routeHelper.viewData('categoryid', -1);
			}

			const tasks = [
				// 加载网站配置
				async() => {
					const options = await optionsBLL.read();
					if (!options) {
						throw util.createError('网站配置丢失', 500);
					} else if (!options.isopen) {
						throw util.createError(options.tipstext || '网站已关闭');
					} else {
						if (isHTMLPage) {
							res.routeHelper.appendTitle(options.sitename);
							res.routeHelper.appendKeywords(options.keywords.split(/\s*,\s*/));
							res.routeHelper.viewData({
								description: options.description,
								currentOptions: options
							});
						}
					}
				}
			];

			if (isHTMLPage) {
				tasks.push(
					// 加载可见分类
					async() => {
						const list = await categoryBLL.list(1);
						if (list) {
							res.routeHelper.viewData('categoryList', list);
						}
					},

					// 加载可见链接
					async() => {
						const list = await linkBLL.list(1);
						if (list) {
							res.routeHelper.viewData('linkList', list);
						}
					}
				);
			}

			return Promise.all(
				tasks.map((task) => { return task(); })
			);
		}, callbacks)
	);
};


// 管理后台页面
exports.admin = function(callbacks) {
	return basicPage(
		prepend((req, res) => {
			if (res.routeHelper.type() === 'html') {
				res.routeHelper.appendTitle('LetsBlog后台管理系统');
			}
			if (!req.currentUser.userid) {
				throw util.createError('请先登录', 403);
			}
		}, callbacks)
	);
};