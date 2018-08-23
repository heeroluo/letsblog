/*!
 * LetsBlog
 * Business logic layer of user group
 * Released under MIT license
 */

'use strict';

const util = require('../lib/util');
const validator = require('../lib/validator');
const userGroupModel = require('../entity/usergroup');
const userGroupDAL = require('../dal/usergroup');
const Cache = require('./_cache');


// 用户组的改动较少，且经常用于权限判断
// 缓存在内存中可以避免频繁访问数据库
const listCache = new Cache(() => {
	return userGroupDAL.list().then((result) => {
		// 冻结对象，防止因意外修改导致脏数据的出现
		return Object.freeze(
			(result || []).map((group) => {
				return Object.freeze(userGroupModel.createEntity(group));
			})
		);
	});
});

// 向外暴露清理缓存的接口
const clearCache = exports.clearCache = () => { listCache.clear(); };


// 读取用户组数据列表
// type为true时返回map，否则返回数组
const list = exports.list = (type) => {
	return listCache.promise().then((result) => {
		return type ? util.arrayToMap(result, 'groupid') : result;
	});
};


// 读取单条用户组数据
const read = exports.read = (groupid) => {
	return list(true).then((result) => {
		return result[groupid];
	});
};


// 创建和更新数据前的验证
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

// 创建用户组
exports.create = (userGroup) => {
	const err = validate(userGroup);
	return err ?
		util.createError(err) :
		userGroupDAL.create(userGroup.toDbRecord()).then(clearCache);
};

// 更新用户组
exports.update = (userGroup, groupid) => {
	const err = validator.isAutoId(groupid) ? validate(userGroup) : '无效的用户组编号';
	return err ?
		util.createError(err) :
		userGroupDAL.update(userGroup.toDbRecord(), groupid).then(clearCache);
};


// 删除用户组
exports.delete = (groupid) => {
	if (!validator.isAutoId(groupid)) {
		return util.createError('无效的用户组编号');
	}

	if (groupid <= 2) { return util.createError('不能删除系统用户组'); }

	return read(groupid).then((result) => {
		let err;
		if (!result) {
			err = '用户组不存在';
		} else if (result.totalusers) {
			err = '不能删除有用户的用户组';
		}

		return err ?
			util.createError(err) :
			userGroupDAL.delete(groupid).then(clearCache);
	});
};