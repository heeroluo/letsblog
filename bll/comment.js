/*!
 * LetsBlog
 * Business logic layer of comment
 * Released under MIT license
 */

'use strict';

var crypto = require('crypto'),
	Promise = require('bluebird'),
	util = require('../lib/util'),
	validator = require('../lib/validator'),
	userBLL = require('./user'),
	articleBLL = require('./article'),
	commentModel = require('../entity/comment'),
	commentDAL = require('../dal/comment');


// 发表评论前的验证
function validate(comment, user) {
	var err;

	if (!comment.content) {
		err = '评论内容不能为空';
	} else if (comment.content.length > 1000) {
		err = '评论内容不能多于1000个字符';
	} else if (!comment.articleid) {
		err = '文章编号不能为空';
	} else if (!user || !user.group.perm_comment) {
		err = '您没有权限发表评论';
	}

	var tasks = [ ];
	if (user && user.userid) {
		tasks.push(function() {
			return userBLL.readByUserId(user.userid).then(function(result) {
				if (!result) { return util.createError('用户不存在'); }

				comment.userid = result.userid;
				comment.user_nickname = result.nickname;
				comment.user_email = result.email;
				comment.user_qq = '';
			});
		});
	} else {
		comment.userid = 0;
		if ( comment.user_email && !validator.isEmail(comment.user_email) ) {
			err = 'Email格式错误';
		} else if ( comment.user_qq && !validator.isQQ(comment.user_qq) ) {
			err = 'QQ号码格式错误';
		} else if ( !comment.user_nickname ) {
			err = '昵称不能为空';
		} else if ( !validator.isNickname(comment.user_nickname) ) {
			err = '昵称必须为2-20个字符';
		}

		tasks.push(function() {
			return commentDAL.getTotalCommentsAfterTime(
				new Date(Date.now() - 5000), comment.ip
			).then(function(result) {
				if (result > 0) {
					return util.createError('发表评论的间隔不能小于5秒');
				}
			});
		});
	}

	tasks.push(function() {
		return articleBLL.read(comment.articleid).then(function(result) {
			if (!result) { return util.createError('文章不存在'); }
		});
	});

	return err ?
		util.createError(err):
		util.promiseSeries(tasks);
}

// 发表评论
// user为当前操作用户，用于检查权限
exports.create = function(comment, user) {
	return validate(comment, user).then(function(result) {
		// 如果用户本身有审核评论的权限，就直接把评论设为审核通过，否则为待审核状态
		comment.state = user.group.perm_comment >= 2 || user.group.perm_manage_comment ? 1 : 0;
		return commentDAL.create( comment.toDbRecord() );
	});
};


// 读取评论数据列表（带分页）
exports.list = function(params, pageSize, page, callback) {
	if (params) {
		if ( !validator.isAutoId(params.articleid) ) { delete params.articleid; }
		if ( [0, 1].indexOf(params.state) === -1 ) { delete params.state; }
	}

	return commentDAL.list(params, pageSize, page).then(function(result) {
		result.data = result.data.map(function(c) {
			if (c.user_current_nickname) {
				c.user_nickname = c.user_current_nickname;
				delete c.user_current_nickname;
			}
			if (c.user_current_email) {
				c.user_email = c.user_current_email;
				delete c.user_current_email;
			}
			return commentModel.createEntity(c);
		});

		return result;
	});
};


// 更新评论状态
exports.updateState = Promise.method(function(state, commentids) {
	var err;
	if ([0, 1].indexOf(state) === -1) {
		err = '无效的评论状态';
	} else if (!commentids.length) {
		err = '请选择要操作的评论';
	} else if (commentids.some(function(id) { return !validator.isAutoId(id); })) {
		err = '无效的评论编号';
	}

	return err ?
		util.createError(err) :
		commentDAL.updateState(state, commentids);
});

// 获取未审核评论数
exports.getTotalPendingReviews = function() {
	return commentDAL.getTotalPendingReviews();
};


// 根据评论编号批量删除评论
exports.deleteByCommentIds = function(commentids) {
	var err;
	if (!commentids.length) {
		err = '请选择要操作的评论';
	} else if (commentids.some(function(id) { return !validator.isAutoId(id); })) {
		err = '无效的评论编号';
	}

	return err ?
		util.createError(err) :
		commentDAL.deleteByCommentIds(commentids);
};

// 根据文章编号批量删除评论
exports.deleteByArticleIds = function(articleids) {
	var err;
	if (!articleids.length) {
		err = '请选择要操作的文章';
	} else if (articleids.some(function(id) { return !validator.isAutoId(id); })) {
		err = '无效的文章编号';
	}

	return err ?
		util.createError(err) :
		commentDAL.deleteByArticleIds(articleids);
};