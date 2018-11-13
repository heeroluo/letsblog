const { isUsername, isEmail, isNickname } = require('./common');


// 创建和更新数据前的主要属性验证
exports.validate = (user) => {
	if (!isUsername(user.username)) {
		return '用户名必须为2-20个英文字母、数字或下划线';
	} else if (!user.groupid) {
		return '用户组不能为空';
	} else if (user.email && !isEmail(user.email)) {
		return 'Email格式错误';
	} else if (user.nickname && !isNickname(user.nickname)) {
		return '昵称必须为2-20个字符';
	}

	// 默认以用户名为昵称
	user.nickname = user.nickname || user.username;
};

// 检查密码合法性和强度
exports.checkPassword = (password) => {
	if (password.length < 6 || password.length > 16) {
		return '密码必须为6-16个字符';
	}
	if (/^\d+$/.test(password)) {
		return '密码不能为纯数字';
	}
	if (/^[a-z]+$/i.test(password)) {
		return '密码不能为纯英文';
	}
};

// 检查列表查询参数的合法性
exports.checkListParams = (params) => {
	if (params.groupid != null && !isAutoId(params.groupid)) {
		return '用户组编号错误';
	}
};