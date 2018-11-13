const { readByUsernameAndPassword } = require('../bll/user');
const readUserGroup = require('../bll/usergroup').read;


// 获取当前用户身份
exports['auth'] = async(ctx) => {
	const username = ctx.cookies.get('username');
	const password = ctx.cookies.get('password') || '';

	let user;
	if (username && password) {
		user = await readByUsernameAndPassword(
			username,
			password
		);
	}

	if (!user) {
		user = {
			userid: 0,
			username: '',
			groupid: 2
		};
		user.usergroup = await readUserGroup(user.groupid);
	}

	return user;
};