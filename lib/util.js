/*!
 * LetsBlog
 * Utility functions (2015-02-24T13:37:21+0800)
 * Released under MIT license
 */

'use strict';


/**
 * 把源对象的属性扩展到目标对象
 * @method extend
 * @param {Any} target 目标对象
 * @param {Any*} [source] 源对象。若有同名属性，则后者覆盖前者
 * @return {Any} 目标对象
 */
exports.extend = function(target) {
	if (target == null) { throw new Error('target cannot be null'); }

	var i = 0, len = arguments.length, p, src;
	while (++i < len) {
		src = arguments[i];
		if (src != null) {
			for (p in src) {
				if (src.hasOwnProperty(p)) {
					target[p] = src[p];
				}
			}
		}
	}

	return target;
};

/**
 * 创建类
 * @method createClass
 * @param {Function} constructor 构造函数
 * @param {Object} [methods] 方法
 * @param {Function} [Parent] 父类
 * @param {Function(args)|Array} [parentArgs] 传递给父类的参数，默认与子类构造函数参数一致
 * @return {Function} 类
 */
exports.createClass = function(constructor, methods, Parent, parentArgs) {
	var $Class = Parent ? function() {
		Parent.apply(
			this,
			parentArgs ? 
				(typeof parentArgs === 'function' ?
					parentArgs.apply(this, arguments) : parentArgs)
			: arguments
		);
		constructor.apply(this, arguments);
	} : function() { constructor.apply(this, arguments); };

	if (Parent) {
		var $Parent = function() { };
		$Parent.prototype = Parent.prototype;
		$Class.prototype = new $Parent();
		$Class.prototype.constructor = $Class;
	}
	if (methods) {
		for (var m in methods) { $Class.prototype[m] = methods[m]; }
	}
	return $Class;
};


/**
 * 把数组转换为map结构
 * @method arrayToMap
 * @param {Array} arr 数组
 * @param {String} keyName 键名
 * @param {Function} [filter] 过滤函数
 * @return {Object} map结构
 */
exports.arrayToMap = function(arr, keyName, filter) {
	var result = { };
	arr.forEach(function(item) {
		if (!filter || filter.apply(this, arguments) === true) {
			result[ item[keyName] ] = item;
		}
	});

	return result;
};


var typeConverter = {
	// 转换成数字
	'number': function(val) {
		val = Number(val);
		if ( isNaN(val) ) { val = 0; }

		return val;
	},
	// 转换成整数
	'int': function(val) {
		val = parseInt(val);
		if ( isNaN(val) ) { val = 0; }

		return val;
	},
	// 转换成日期
	'date': function(val) {
		val = new Date(val);
		if ( isNaN( val.getTime() ) ) {
			val = new Date(0);
		}

		return val;
	},
	// 转换成字符串
	'string': function(val) {
		return val == null ? '' : String(val);
	},
	// 转换成数组
	'array': function(val, options) {
		if ( Array.isArray(val) ) {
			return val;
		} else {
			if (typeof val === 'string' && val !== '') {
				return val.split( (options || { }).separator || /\s*,\s*/ );
			} else {
				return [ ];
			}
		}
	}
};

/**
 * 类型转换
 * @method convert
 * @param {Any} val 要转换的值
 * @param {String} type 目标类型：number-数字；int-整数；date-日期
 * @return {Any} 转换结果
 */
exports.convert = function(val, type) {
	var memberType;
	// 识别 Array<Type>
	type = type.replace(/<([a-z]+)>$/, function(match, $1) {
		memberType = $1;
		return '';
	});

	if (typeConverter[type]) {
		val = typeConverter[type](val);
		if (memberType) {
			if ( Array.isArray(val) ) {
				for (var i = val.length - 1; i >= 0; i--) {
					val[i] = typeConverter[memberType](val[i]);
				}
			} else {
				for (var i in val) {
					if ( val.hasOwnProperty(i) ) {
						val[i] = typeConverter[memberType](val[i]);
					}
				}
			}
		}
	}
	return val;
};


/**
 * 转换为URL参数字符串
 * @method toQueryString
 * @param {Array|Object} data 数据
 * @param {String} [url] 如果不为null，则把参数字符串添加到此URL上返回
 * @return {String} URL参数字符串
 */
exports.toQueryString = function(data, url) {
	var result = [ ];
	if ( Array.isArray(data) ) {
		data.forEach(function(d) {
			if (d.value != null && d.value != '') {
				result.push( encodeURIComponent(d.name) + '=' + encodeURIComponent(d.value) );
			}
		});
	} else {
		for (var d in data) {
			if (data.hasOwnProperty(d) && data[d] != null && data[d] !== '') {
				result.push( encodeURIComponent(d) + '=' + encodeURIComponent(data[d]) );
			}
		}
	}

	result = result.join('&amp;');
	if (url != null) {
		result = url + (url.indexOf('?') === -1 ? '?' : '&amp;') + result;
	}

	return result;
};


/**
 * 格式化日期
 * @method formatDate
 * @param {Date} date 日期
 * @param {String} formation 日期格式
 * @return {String} 格式化后的日期字符串
 */
exports.formatDate = function(date, formation) {
	function toTwoDigit(num) { return num < 10 ? '0' + num : num; }

	var y = date.getFullYear(),
		M = date.getMonth() + 1,
		d = date.getDate(),
		h = date.getHours(),
		m = date.getMinutes(),
		s = date.getSeconds();

	return formation.replace(/y+|m+|d+|h+|s+|H+|M+/g, function(match) {
		switch (match) {
			case 'yyyy': return y;
			case 'yy': return y.toString().slice(-2);
			case 'MM': return toTwoDigit(M);
			case 'M': return M;
			case 'dd': return toTwoDigit(d);
			case 'd': return d;
			case 'HH': return toTwoDigit(h);
			case 'H': return h;
			case 'hh': return toTwoDigit(h > 12 ? h - 12 : h);
			case 'h': return h > 12 ? h - 12 : h;
			case 'mm': return toTwoDigit(m);
			case 'm': return m;
			case 'ss': return toTwoDigit(s);
			case 's': return s;
			default: return match;
		}
	});
};


/**
 * 格式化日期为距离现在多长时间的格式
 * @method formatDateFromNow
 * @param {Date} date 日期
 * @return {String} 格式化后的日期字符串
 */
exports.formatDateFromNow = function(date) {
	var timespan = (new Date - date) / 1000, result;
	if (timespan < 60) {
		result = '1分钟内';
	} else {
		[
			{ name: '年', value: 365 * 24 * 60 * 60 },
			{ name: '个月', value: 30 * 24 * 60 * 60 },
			{ name: '天', value: 24 * 60 * 60 },
			{ name: '小时', value: 60 * 60 },
			{ name: '分钟', value: 60 }
		].some(function(unit) {
			var value = parseInt(timespan / unit.value);
			if (value) {
				result = value + unit.name + '前';
				return true;
			}
		});
	}

	return result;
};


/**
 * 创建错误对象
 * @method createError
 * @param {String} msg 错误信息
 * @param {Number} [status=200] 错误状态
 * @return {Error} 错误对象
 */
exports.createError = function(msg, status) {
	var err = new Error(msg);
	err.status = status || 200;
	return err;
};


/**
 * 创建分页条数据
 * @method createPaginatorData
 * @param {Number} currentPage 当前页
 * @param {Number} totalPages 总页码
 * @param {String} hrefTpl 分页条模板
 * @param {Object} options 其他参数
 * @return {Object} 分页条数据
 */
exports.createPaginatorData = function(currentPage, totalPages, hrefTpl, options) {
	options = options || { };

	var numberOfPagesToShow = options.numberOfPagesToShow || 3,
		numberOfPagesPerSide = parseInt((numberOfPagesToShow - 1) / 2),
		data = [ ];

	currentPage = currentPage || 1;
	hrefTpl = hrefTpl || '?page={{page}}';

	// 当前页及其前后两侧的页码
	var start = currentPage - numberOfPagesPerSide,
		end = currentPage + numberOfPagesPerSide,
		startOverflow = start - 1,
		endOverflow = totalPages - end;

	if (startOverflow < 0) {
		start = 1;
		end = Math.min(totalPages, end - startOverflow);
	}
	if (endOverflow < 0) {
		end = totalPages;
		if (startOverflow > 0) { start = Math.max(1, start + endOverflow); }
	}

	if (end - start + 1 < numberOfPagesToShow) {
		if (end < totalPages) {
			end++;
		} else if (start > 1) {
			start--;
		}
	}

	for (var i = start; i <= end; i++) {
		data.push({
			page: i,
			current: i == currentPage
		});
	}

	var temp = start - 1;
	if (temp) {
		if (temp > 2) {
			data.unshift({
				page: '...'
			});
		} else if (temp > 1) {
			data.unshift({
				page: 2,
				current: false
			});
		}
		data.unshift({
			page: 1,
			current: false
		});
	}

	temp = totalPages - end;
	if (temp) {
		if (temp > 2) {
			data.push({
				page: '...'
			});
		} else if (temp > 1) {
			data.push({
				page: end + 1,
				current: false
			});
		}
		data.push({
			page: totalPages,
			current: false
		});
	}

	var prevHref, nextHref;
	data.forEach(function(d) {
		if (typeof d.page === 'number') {
			d.href = hrefTpl.replace('{{page}}', d.page);
			if (d.page === currentPage + 1) {
				nextHref = d.href;
			} else if (d.page === currentPage - 1) {
				prevHref = d.href;
			}
		}
	});

	return {
		currentPage: currentPage,
		totalPages: totalPages,
		pageNumbers: data,
		nextHref: nextHref,
		prevHref: prevHref
	};
};


/**
 * 移动文件到上传目录
 * @method moveToUploadDir
 * @param {String} sourcePath 原路径
 * @param {String} targetDir 目标目录
 * @param {Function} callback 回调函数
 */
exports.moveToUploadDir = function(sourcePath, targetDir, callback) {
	var	fs = require('fs'), path = require('path'), now = new Date();

	// 增加年月目录
	targetDir = path.join(
		targetDir, now.getFullYear() + ('0' + (now.getMonth() + 1)).slice(-2)
	);

	var moveFile = function() {
		var targetPath = path.join( targetDir, path.basename(sourcePath) );
		fs.rename(sourcePath, targetPath, function(err) {
			if (callback) {
				if (err) {
					callback(err);
				} else {
					callback(null, targetPath);
				}
			}
		});
	};

	// 创建年月目录
	fs.exists(targetDir, function(exists) {
		if (exists) {
			moveFile();
		} else {
			fs.mkdir(targetDir, function(err) {
				if (err) {
					if (callback) { callback(err); }
				} else {
					moveFile();
				}
			});
		}
	});
};