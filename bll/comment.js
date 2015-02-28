/*!
 * LetsBlog
 * Business logic layer of comment (2015-02-25T09:14:10+0800)
 * Released under MIT license
 */

'use strict';

var crypto =  require('crypto'),
	async = require('async'),
	util = require('../lib/util'),
	validator = require('../lib/validator'),
	userBLL = require('./user'),
	articleBLL = require('./article'),
	commentModel = require('../entity/comment'),
	commentDAL = require('../dal/comment');


function validate(comment, user, callback) {
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
		tasks.push(function(callback) {
			userBLL.readByUserId(user.userid, function(err, result) {
				if (!err) {
					if (result) {
						comment.userid = result.userid;
						comment.user_nickname = result.nickname;
						comment.user_email = result.email;
						comment.user_qq = '';
					} else {
						err = util.createError('用户不存在');
					}
				}
				callback(err);
			});
		});
	} else {
		comment.userid = 0;
		if (comment.user_email && !validator.isEmail(comment.user_email)) {
			err = 'Email格式错误';
		} else if (comment.user_qq && !validator.isQQ(comment.user_qq)) {
			err = 'QQ号码格式错误';
		} else if (!comment.user_nickname) {
			err = '昵称不能为空';
		} else if (!validator.isNickname(comment.user_nickname)) {
			err = '昵称必须为2-20个字符';
		}
		tasks.push(function(callback) {
			commentDAL.getTotalCommentsAfterTime(
				new Date(Date.now() - 5000), comment.ip,
				function(err, result) {
					if (!err) {
						if (result > 0) {
							err = util.createError('发表评论的间隔不能小于5秒');
						}
					}
					callback(err);
				}
			);
		});
	}
	tasks.push(function(callback) {
		articleBLL.read(comment.articleid, function(err, result) {
			if (!err && !result) { err = util.createError('文章不存在'); }
			callback(err);
		});
	});

	if (err) {
		callback(err);
	} else if (tasks.length) {
		async.series(tasks, callback);
	}
}

exports.create = function(comment, user, callback) {
	validate(comment, user, function(err) {
		if (err) {
			callback(err);
		} else {
			// 如果用户本身有审核评论的权限，就直接把评论设为审核通过，否则为待审核状态
			console.dir(user.group)
			comment.state = user.group.perm_comment >= 2 || user.group.perm_manage_comment ? 1 : 0;
			commentDAL.create(comment.toDbRecord(), callback);
		}
	});
};


exports.list = function(params, pageSize, page, callback) {
	if (params) {
		if ( !validator.isAutoId(params.articleid) ) { delete params.articleid; }
		if ( [0, 1].indexOf(params.state) === -1 ) { delete params.state; }
	}

	commentDAL.list(params, pageSize, page, function(err, result) {
		if (result && result.data) {
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
		}
		callback(err, result);
	});
};


exports.updateState = function(state, commentids, callback) {
	var err;
	if ([0, 1].indexOf(state) === -1) {
		err = '无效的评论状态';
	} else if (commentids.some(function(id) { return !validator.isAutoId(id); })) {
		err = '无效的评论编号';
	}

	if (err) {
		callback(util.createError(err));
	} else {
		commentDAL.updateState(state, commentids, callback);
	}
};


exports.deleteByCommentIds = function(commentids, callback) {
	if ( commentids.some(function(id) { return !validator.isAutoId(id); }) ) {
		callback( util.createError('无效的评论编号') );
	} else {
		commentDAL.deleteByCommentIds(commentids, callback);
	}
};

exports.deleteByArticleIds = function(articleids, callback) {
	if ( articleids.some(function(id) { return !validator.isAutoId(id); }) ) {
		callback( util.createError('无效的文章编号') );
	} else {
		commentDAL.deleteByArticleIds(articleids, callback);
	}
};

exports.getTotalPendingReviews = function(callback) {
	commentDAL.getTotalPendingReviews(callback);
};