/*!
 * LetsBlog
 * Routes of user
 * Released under MIT license
 */

'use strict';

const pageType = require('../page-type');
const userBLL = require('../../bll/user');


// 登录页
exports.login = pageType.basic((req, res) => {
	const referrer = req.get('Referrer') || '/admin/home';
	if (req.currentUser.userid) {
		res.redirect(referrer);
		return true;
	} else {
		res.routeHelper.viewData('referrer', referrer);
	}
});

// 登录页提交
exports['login/post'] = {
	verb: 'post',
	resType: 'json',
	callbacks: function(req, res) {
		const username = req.body.username, password = req.body.password;

		return userBLL.login(username, password, req.ip).then(function(user) {
			const cookieOptions = {
				path: '/',
				expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			};
			res.cookie('username', user.username, cookieOptions);
			cookieOptions.httpOnly = true;
			res.cookie('password', user.password, cookieOptions);

			user = user.toPureData();
			delete user.password;

			res.routeHelper.viewData('currentUser', user);
		});
	}
};

// 退出登录
exports.logout = function(req, res) {
	const expires = new Date(0);
	res.cookie('username', '', { expires: expires });
	res.cookie('password', '', { expires: expires });

	res.redirect(req.query.referrer || req.get('Referrer') || '/');
};