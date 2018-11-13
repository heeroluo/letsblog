const commentBLL = require('../../bll/comment');
const { createError } = require('../../../assets/common/util/util');


exports.getTotalPendingReviews = async(ctx) => {
	if (!ctx.request.user.usergroup.perm_manage_comment) {
		throw createError('权限不足', 403);
	}
	return commentBLL.getTotalPendingReviews();
};