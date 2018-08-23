/*!
 * LetsBlog
 * Database accessing interfaces
 * Released under MIT license
 */

'use strict';

const mysql = require('mysql');
const appConfig = require('../config');
const pool = mysql.createPool(appConfig.database);


/**
 * 执行数据库请求
 * @method query
 * @param {String} cmd SQL命令
 * @param {Any} [args] 命令参数
 * @return {Promise} 执行数据库请求的Promise实例
 */
const query = exports.query = (cmd, args) => {
	return new Promise((resolve, reject) => {
		pool.getConnection((err, conn) => {
			if (err) {
				reject(err);
			} else {
				conn.query(cmd, args, (err, rows) => {
					conn.release();
					if (err) {
						reject(err);
					} else {
						resolve(rows);
					}
				});
			}
		});
	});
};


/**
 * 分页读取记录
 * @method dataPaging
 * @param {String} sql SQL命令
 * @param {Object} [options] 其他参数
 *   @param {Number} [options.page=1] 页码，为-1时读取最后一页数据
 *   @param {Number} [options.pageSize=10] 每页记录数，为-1时读取所有记录
 *   @param {Number} [options.params] 命令参数
 *   @param {Boolean} [options.onlyTotal=false] 是否只计算记录总数
 */
exports.dataPaging = (sql, options) => {
	return new Promise((resolve) => {
		if (!sql) { throw new Error('please specify a SQL query'); }

		options = options || { };
		// 默认取10条记录
		options.pageSize = parseInt(options.pageSize) || 10;

		// 无需分页
		if (options.pageSize === -1) {
			return resolve(query(sql, options.params).then((data) => {
				return { data };
			}));
		}

		// XXX 通过正则简单替换，不能适应复杂的SQL语句
		const sqlToCount = sql.replace(
			/^select\s+.*?\s+from\s+/i,
			'SELECT COUNT(*) as total FROM '
		);

		// 默认取第一页
		options.page = parseInt(options.page) || 1;

		const result = { };
		resolve(
			query(sqlToCount, options.params).then((resultTotal) => {
				result.pageSize = options.pageSize;
				result.totalRows = resultTotal[0].total;
				result.totalPages = Math.ceil(result.totalRows / result.pageSize);
				result.page = options.page === -1 ?
					result.totalPages : Math.min(options.page, result.totalPages);

				if (options.onlyTotal) {
					return result;
				} else {
					sql += ' LIMIT ';
					if (result.page > 1) {
						sql += (result.page - 1) * result.pageSize + ',';
					}
					sql += result.pageSize;

					return query(sql, options.params).then((resultData) => {
						result.data = resultData;
						return result;
					});
				}
			})
		);
	});
};