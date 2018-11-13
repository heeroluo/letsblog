const userBLL = require('./user');
const articleBLL = require('./article');
const commentDAL = require('../dal/comment');
const { validate, checkListParams } = require('./validator/comment');
const { isAutoId } = require('./validator/common');
const { createError } = require('../lib/util');


// 发评论验证
async function validateMain(comment, user) {
	if (user && user.userid) {
		user = await userBLL.readByUserId(user.userid);
		if (!user) { return '用户不存在'; }

		comment['userid'] = user.userid;
		comment['user_nickname'] = user.nickname;
		comment['user_email'] = user.email;
		comment['user_qq'] = '';

	} else {
		comment.userid = 0;

		const count = await commentDAL.getTotalCommentsAfterTime(
			new Date(Date.now() - 60000), comment.ip
		);
		if (count > 6) {
			return '1分钟内发表的评论不能超过6条';
		}
	}

	const err = validate(comment);
	if (err) { return err; }

	const article = await articleBLL.read(comment.articleid);
	if (!article) { return '文章不存在'; }
}


// 创建评论
exports.create = async(comment, user) => {
	const err = await validateMain(comment, user);
	if (err) { throw createError(err, 400); }

	// 如果用户本身有审核评论的权限，就直接把评论设为审核通过，否则为待审核状态
	comment.state = user.usergroup.perm_comment >= 2 ||
		user.usergroup.perm_manage_comment ? 1 : 0;

	return commentDAL.create(comment);
};


// 更新评论状态
exports.updateState = async(state, ids) => {
	let err;
	if ([0, 1].indexOf(state) === -1) {
		err = '无效的评论状态';
	} else if (!ids.length) {
		err = '请选择要操作的评论';
	} else if (ids.some((id) => { return !isAutoId(id); })) {
		err = '无效的评论编号';
	}
	if (err) { throw createError(err, 400); }

	await commentDAL.updateState(state, ids);
};


// 根据评论编号批量删除评论
exports.deleteByCommentIds = async(ids) => {
	if (!ids.length) {
		throw createError('请选择要操作的评论', 400);
	} else if (ids.some((id) => { return !isAutoId(id); })) {
		throw createError('无效的评论编号', 400);
	}

	await commentDAL.deleteByCommentIds(ids);
};

// 根据文章编号批量删除评论
exports.deleteByArticleIds = async(ids) => {
	if (!ids.length) {
		throw createError('请选择要操作的文章', 400);
	} else if (ids.some((id) => { return !isAutoId(id); })) {
		throw createError('无效的文章编号', 400);
	}

	await commentDAL.deleteByArticleIds(ids);
};


// 读取评论数据列表（带分页）
exports.list = (pageSize, page, params) => {
	if (params) {
		const err = checkListParams(params);
		if (err) { throw createError(err, 400); }
	}
	return commentDAL.list(pageSize, page, params);
};


// 获取未审核评论数
exports.getTotalPendingReviews = async() => {
	return commentDAL.getTotalPendingReviews();
};