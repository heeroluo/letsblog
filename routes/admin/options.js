/*!
 * LetsBlog
 * Routes of options management pages (2015-02-25T11:24:21+0800)
 * Released under MIT license
 */

'use strict';

var util = require('../../lib/util'),
	optionsBLL = require('../../bll/options');


// 权限验证
function addPermissionChecking(handler) {
	return function(req, res, next) {
		if (!req.currentUser.group.perm_manage_option) {
			next(util.createError('权限不足', 403));
		} else {
			handler.apply(this, arguments);
		}
	};
}

exports.update = addPermissionChecking(function(req, res, next) {
	optionsBLL.read(function(err, result) {
		if (!err) {
			res.routeHandler.setData('options', result);
		}
		next(err);
	});
});

exports.update_post = addPermissionChecking(function(req, res, next) {
	var options = req.getEntity('options', 'update');
	optionsBLL.update(options, function(err) {
		if (err) {
			next(err);
		} else {
			res.routeHandler.renderInfo(res, {
				message: '更新成功'
			});
		}
	});
});