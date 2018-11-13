// 是否Email
exports.isEmail = (val) => {
	let temp = /^[\w-]+(?:\.[\w-]+)*@[\w-]+(?:\.[\w-]+)*\.[a-zA-Z]{2,}$/.test(val);
	if (temp) {
		temp = val.replace('@', '.').split('.');
		for (let i = temp.length - 2; i >= 0; i--) {
			if (/^[-_]/.test(temp[i]) || /[_-]$/.test(temp[i])) {
				return false;
			}
		}
	} else {
		return false;
	}

	return true;
};

// 是否权重
exports.isWeight = (val) => {
	return val >= 0 && val <= 255;
};

// 是否用户名
exports.isUsername = (val) => {
	return /^\w{2,20}$/.test(val);
};

// 是否昵称
exports.isNickname = (val) => {
	return val.length >= 2 && val.length <= 20;
};

// 是否自动编号
exports.isAutoId = (val) => {
	val = Number(val);
	return !isNaN(val) && val > 0;
};

// 是否英文标题
exports.isEnTitle = (val) => {
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val);
};

// 是否QQ号
exports.isQQ = (val) => {
	return /^[1-9]\d{4,}$/.test(val);
};