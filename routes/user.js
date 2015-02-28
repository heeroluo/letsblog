/*!
 * LetsBlog
 * Routes of user (2015-02-25T11:24:59+0800)
 * Released under MIT license
 */

'use strict';

var userBLL = require('../bll/user');


exports.login = function(req, res, next) {
	var referrer = req.get('Referrer') || '/admin/home';
	if (req.currentUser.userid) {
		res.redirect(referrer);
	} else {
		res.routeHandler.setData('referrer', referrer);
		next();
	}
};

exports.login_post = function(req, res, next) {
	if (req.currentUser.userid) {
		next();
	} else {
		var username = req.body.username,
			password = req.body.password,
			remember = req.body.remember;

		userBLL.login(username, password, req.ip, function(err, user) {
			if (err) {
				next(err);
			} else {
				var cookieOptions = {
					path: '/',
					expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
				};
				res.cookie('username', user.username, cookieOptions);
				cookieOptions.httpOnly = true;
				res.cookie('password', user.password, cookieOptions);

				user = user.toPureData();
				delete user.password;

				res.routeHandler.setData('currentUser', user);
				next();
			}
		});
	}
};

exports.logout = function(req, res, next) {
	var referrer = req.query.referrer || req.get('Referrer');

	res.cookie('username', '', { expires: new Date(0) });
	res.cookie('password', '', { expires: new Date(0) });

	res.redirect(referrer);
};