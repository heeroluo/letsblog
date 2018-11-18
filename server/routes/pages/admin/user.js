/*!
 * LetsBlog
 * Routes of user management pages
 * Released under MIT license
 */

'use strict';

const util = require('../../../lib/util');
const pageType = require('../../page-type');
const userBLL = require('../../../bll/user');


// 创建权限验证函数
function createPermissionChecking(limit) {
	return (req) => {
		if (req.currentUser.usergroup.perm_manage_user < limit) {
			return util.createError('权限不足', 403);
		}
	};
}


// 身份验证
exports.whoAmI = {
	resType: 'json',
	callbacks: async(req, res) => {
		let user;

		const username = req.cookies.username;
		const password = req.cookies.password;
		try {
			user = await userBLL.readByUsernameAndPassword(
				username,
				password
			);
		} catch (e) { }

		if (user) {
			delete user.password;
			res.routeHelper.viewData('me', user);
		}
	}
};


exports.read = {
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(createPermissionChecking(1), async(req, res) => {
			res.routeHelper.viewData('user', await userBLL.readByUserId(req.query.id));
		})
	)
};


// 提交新用户
exports.create = {
	verb: 'post',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(createPermissionChecking(1), async(req) => {
			const user = req.getModel('user', req.body);
			// 生成注册日期、最后活动时间
			user.regtime = user.lastactivity = new Date();
			// 获取当前IP
			user.lastip = req.ip;

			await userBLL.create(user, req.currentUser);
		})
	)
};



// 更新个人资料时，isMyProfile传true
async function submitUpdateForm(userid, isMyProfile, req) {
	const newUser = req.getModel('user', req.body);
	if (!isMyProfile) { userid = newUser.userid; }

	const user = await userBLL.readByUserId(userid);
	if (!user) {
		throw util.createError('用户不存在', 404);
	}

	newUser.username = user.username;
	// 更新个人资料时，保持原有用户组
	if (isMyProfile) { newUser.groupid = req.currentUser.groupid; }

	// 更新个人资料时，无需检查当前用户的权限，第三个参数传null
	await userBLL.updateProfile(
		newUser, userid, isMyProfile ? null : req.currentUser
	);
}

// 提交个人资料修改
exports['i/update'] = {
	verb: 'put',
	resType: 'json',
	callbacks: pageType.admin(
		async(req) => {
			await submitUpdateForm(req.currentUser.userid, true, req);
		}
	)
};

// 提交用户资料修改
exports.update = {
	verb: 'put',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(createPermissionChecking(2), async(req) => {
			await submitUpdateForm(null, false, req);
		})
	)
};


// 提交个人密码修改
exports['i/update/password'] = {
	verb: 'put',
	resType: 'json',
	callbacks: pageType.admin(async(req, res) => {
		const newPassword = req.body.newpassword;

		const result = await userBLL.updatePassword(
			newPassword, req.body.oldpassword, req.currentUser.username
		);

		// 更新cookie中的密码
		res.cookie('password', result.newPassword, {
			path: '/',
			expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
			httpOnly: true
		});
	})
};

// 提交用户密码修改
exports['update/password'] = {
	verb: 'put',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(createPermissionChecking(2), async(req) => {
			await userBLL.updatePassword(
				req.body.newpassword, null, req.body.username
			);
		})
	)
};


// 用户列表
exports.list = {
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(createPermissionChecking(2), async(req, res) => {
			const page = parseInt(req.query.page) || 1;
			const params = {
				name: req.query.name || '',
				groupid: req.query.groupid ? parseInt(req.query.groupid) : null
			};

			const result = await userBLL.list(15, page, params);
			res.routeHelper.viewData({
				pageCount: result.pageCount,
				page: result.page,
				rows: result.rows
			});
		})
	)
};


// 批量删除用户
exports['delete'] = {
	verb: 'delete',
	resType: 'json',
	callbacks: pageType.admin(
		pageType.prepend(createPermissionChecking(2), async(req) => {
			await userBLL.delete(req.body.userids);
		})
	)
};