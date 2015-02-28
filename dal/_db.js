/*!
 * LetsBlog
 * Database accessing helper (2015-02-19T11:27:25+0800)
 * Released under MIT license
 */

'use strict';


var mysql = require('mysql'),
	config = require('../config'),
	pool = mysql.createPool(config.db);

/**
 * 执行数据库请求
 * @method query
 * @param {String} cmd SQL命令
 * @param {Any} [args] 命令参数
 * @param {Function} [callback] 回调函数
 */
/**
 * 执行数据库请求
 * @method query
 * @param {String} cmd SQL命令
 * @param {Function} [callback] 回调函数
 */
function query(cmd) {
	var args, callback;
	// 重载
	if (arguments.length <= 2) {
		callback = arguments[1];
	} else {
		args = arguments[1];
		callback = arguments[2];
	}

	pool.getConnection(function(err, conn) {
		if (err) {
			if (callback) { callback(err); }
		} else {
			conn.query(cmd, args, function(err) {
				try {
					if (callback) { callback.apply(this, arguments); }
				} finally {
					conn.release();
				}
			});
		}
	});
}
exports.query = query;


/**
 * 分页读取记录
 * @method dataPaging
 * @param {String} sql SQL命令
 * @param {Object} [options] 其他参数
 *   @param {Number} [options.page=1] 页码，为-1时读取最后一页数据
 *   @param {Number} [options.pageSize=10] 每页记录数，为-1时读取所有记录
 *   @param {Number} [options.params] 命令参数
 *   @param {Boolean} [options.onlyTotal=false] 是否只计算记录总数
 *   @param {Function} [options.callback] 回调函数，参数依次为err、result
 */
function dataPaging(sql, options) {
	if (!sql) { throw new Error('please specify SQL command'); }

	options = options || { };
	options.pageSize = parseInt(options.pageSize) || 10;

	var callback = options.callback;
	if (typeof callback !== 'function') {
		// 默认设为一个空函数，免得后面要经常判断
		callback = function() { };
	}

	// 加载数据，无需分页
	if (options.pageSize === -1) {
		query(sql, options.params, function(err, result_data) {
			var result;
			if (!err) {
				result = { data: result_data };
			}
			callback.call(this, err, result);
		});
		return;
	}

	// XXX 通过正则简单替换，不能适应复杂的SQL语句
	var sqlToCount = sql.replace(/^select\s+.*?\s+from\s+/i, function() {
		return 'SELECT COUNT(*) as total FROM ';
	});

	options.page = parseInt(options.page) || 1;

	var result = { };
	query(sqlToCount, options.params, function(err, result_total) {
		if (err) { callback.call(this, err); }

		result.pageSize = options.pageSize;
		result.totalRows = result_total[0].total;
		result.totalPages = Math.ceil(result.totalRows / result.pageSize);
		result.page = options.page === -1 ?
			result.totalPages : Math.min(options.page, result.totalPages);

		if (options.onlyTotal) {
			callback.call(this, null, result);
		} else {
			sql += ' LIMIT ';
			if (result.page > 1) {
				sql += (result.page - 1) * result.pageSize + ',';
			}
			sql += result.pageSize;

			query(sql, options.params, function(err, result_data) {
				if (err) {
					result = undefined;
				} else {
					result.data = result_data;
				}
				callback.call(this, err, result);
			});
		}
	});
}
exports.dataPaging = dataPaging;