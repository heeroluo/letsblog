/*!
 * LetsBlog
 * Business logic layer of user group (2015-02-16T15:41:58+0800)
 * Released under MIT license
 */

'use strict';

var util = require('../lib/util'),
	validator = require('../lib/validator'),
	Cache = require('./_cache'),
	userGroupModel = require('../entity/usergroup'),
	userGroupDAL = require('../dal/usergroup');


var allUserGroups = new Cache(function(setCache) {
	userGroupDAL.list(function(err, result) {
		setCache(
			err,
			Object.freeze(
				(result || [ ]).map(function(group) {
					return Object.freeze( userGroupModel.createEntity(group) );
				})
			)
		);
	});
}, exports);
var addClearCacheAction = exports.addClearCacheAction;


var list = exports.list = function(callback, type) {
	allUserGroups.get(function(err, result) {
		if (result) {
			// type为true时，返回map，否则返回数组
			result = type ? util.arrayToMap(result, 'groupid') : result;
		}
		callback(err, result);
	});
};


function validate(userGroup) {
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
}

exports.create = function(userGroup, callback) {
	var err = validate(userGroup);
	if (err) {
		callback(util.createError(err));
	} else {
		userGroupDAL.create(userGroup.toDbRecord(), addClearCacheAction(callback));
	}
};

exports.update = function(userGroup, groupid, callback) {
	var err = validator.isAutoId(groupid) ? validate(userGroup) : '无效的用户组编号';
	if (err) {
		callback(util.createError(err));
	} else {
		userGroupDAL.update(userGroup.toDbRecord(), groupid, addClearCacheAction(callback));
	}
};


var read = exports.read = function(groupid, callback) {
	list(function(err, result) {
		if (err) {
			callback(err);
		} else {
			var group;
			for (var i = result.length - 1; i >= 0; i--) {
				if (result[i].groupid == groupid) {
					group = result[i];
					break;
				}
			}
			callback(err, group);
		}
	});
};


exports.delete = function(groupid, callback) {
	if ( validator.isAutoId(groupid) ) {
		if (groupid <= 2) {
			callback( util.createError('不能删除系统用户组') );
		} else {
			read(groupid, function(err, result) {
				if (!err) {
					if (!result) {
						err = '用户组不存在';
					} else if (result.totalusers) {
						err = '不能删除有用户的用户组';
					}
				}
				if (err) {
					callback(util.createError(err));
				} else {
					userGroupDAL.delete(groupid, addClearCacheAction(callback));
				}
			});
		}
	} else {
		callback( util.createError('无效的用户组编号') );
	}
};