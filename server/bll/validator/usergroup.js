exports.validate = (userGroup) => {
	if (!userGroup.groupname) {
		return '组名不能为空';
	}
	if ([0, 1, 2].indexOf(userGroup.perm_comment) === -1) {
		return '无效的评论权限';
	}
	if ([0, 1].indexOf(userGroup.perm_article) === -1) {
		return '无效的文章发布权限';
	}
	if ([0, 1].indexOf(userGroup.perm_manage_option) === -1) {
		return '无效的站点设置权限';
	}
	if ([0, 1, 2].indexOf(userGroup.perm_manage_user) === -1) {
		return '无效的用户管理权限';
	}
	if ([0, 1, 2].indexOf(userGroup.perm_manage_article) === -1) {
		return '无效的文章管理权限';
	}
	if ([0, 1].indexOf(userGroup.perm_manage_comment) === -1) {
		return '无效的评论管理权限';
	}
};


// 对比权限
// -2: A与B权限各有不同
// -1: A比B低
//  0: A与B相同
// 	1: A比B高
exports.comparePerm = (groupA, groupB) => {
	let result = 0, temp;

	for (let key in groupB) {
		if (groupB.hasOwnProperty(key) && /^perm_/.test(key)) {
			temp = 0;	// 重置

			if (groupA[key] < groupB[key]) {
				temp = -1;
			} else if (groupA[key] > groupB[key]) {
				temp = 1;
			}

			if (temp) {
				if (result) {
					if (result != temp) { return -2; }
				} else {
					result = temp;
				}
			}
		}
	}

	return result;
};