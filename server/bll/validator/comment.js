const { isAutoId, isEmail, isQQ, isNickname } = require('./common');


exports.validate = (comment) => {
	if (!comment.content) {
		return '评论内容不能为空';
	} else if (comment.content.length > 1000) {
		return '评论内容不能多于1000个字符';
	} else if (!comment.articleid) {
		return '文章编号不能为空';
	} else if (comment.user_email && !isEmail(comment.user_email)) {
		return 'Email格式错误';
	} else if (comment.user_qq && !isQQ(comment.user_qq)) {
		return 'QQ号码格式错误';
	} else if (!comment.user_nickname) {
		return '昵称不能为空';
	} else if (!isNickname(comment.user_nickname)) {
		return '昵称必须为2-20个字符';
	}
};

exports.checkListParams = (params) => {
	if (params.articleid != null && !isAutoId(params.articleid)) {
		return '无效的文章编号';
	}
	if (params.state != null && [0, 1].indexOf(params.state) === -1) {
		return '无效的评论状态';
	}
};