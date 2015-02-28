/*!
 * LetsBlog
 * Business logic layer of link (2015-02-16T14:54:52+0800)
 * Released under MIT license
 */

'use strict';

var util = require('../lib/util'),
	validator = require('../lib/validator'),
	Cache = require('./_cache'),
	linkModel = require('../entity/link'),
	linkDAL = require('../dal/link');


var allLinks = new Cache(function(setCache) {
	linkDAL.list(function(err, result) {
		setCache( err, Object.freeze(
			(result || [ ]).map(function(link) {
				return Object.freeze( linkModel.createEntity(link) );
			})
		) );
	});
}, exports);
var addClearCacheAction = exports.addClearCacheAction;


exports.list = function(callback, minWeight) {
	minWeight = Number(minWeight) || 0;

	var filter;
	// 根据最小权重过滤
	if (minWeight > 0) {
		filter = function(link) { return link.weight >= minWeight; };
	}

	allLinks.get(function(err, result) {
		if (result) {
			result = filter ? result.filter(filter) : result;
		}
		callback(err, result);
	});
};

exports.read = function(linkid, callback) {
	if ( validator.isAutoId(linkid) ) {
		this.list(function(err, result) {
			callback(err, result ? result.filter(function(link) {
				return link.linkid == linkid;
			})[0] : null);
		});
	} else {
		callback( new Error('无效的链接编号') );
	}
};


function validate(link) {
	if (!link.linkname) {
		return '站名不能为空';
	}
	if (!link.siteurl) {
		return '链接不能为空';
	}
	if (link.weight < 0 || link.weight > 255) {
		return '权重必须为0-255间的整数';
	}

	// XXX 暂时不做图片链接
	link.logourl = '';
}

exports.create = function(link, callback) {
	var err = validate(link);
	if (err) {
		callback( util.createError(err) );
	} else {
		linkDAL.create( link.toDbRecord(), addClearCacheAction(callback) );
	}
};

exports.update = function(link, linkid, callback) {
	var err = validator.isAutoId(linkid) ? validate(link) : '无效的链接编号';
	if (err) {
		callback( util.createError(err) );
	} else {
		linkDAL.update( link.toDbRecord(), linkid, addClearCacheAction(callback) );
	}
};


exports.delete = function(linkid, callback) {
	if ( validator.isAutoId(linkid) ) {
		linkDAL.delete( linkid, addClearCacheAction(callback) );
	} else {
		callback( util.createError('无效的链接编号') );
	}
};