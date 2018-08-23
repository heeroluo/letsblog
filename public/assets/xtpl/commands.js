const util = require('../common/util/util');


// 浏览器端无需处理引入静态资源的逻辑，直接输出空白即可
exports.css =
exports.js =
exports.modjs = (scope, option, buffer) => {
	const empty = '';
	return option.fn ? buffer.write(empty) : empty;
};


// MD5资源映射表，通过外部js文件（md5-map）引入
let md5Map;
try {
	md5Map = window.md5Map;
} catch (e) {

}
md5Map = md5Map || {};

// 静态资源URL前缀，在root模板中输出为全局变量
let assetURLPrefix;
try {
	assetURLPrefix = util.toURL(window.ASSET_URL_PREFIX);
} catch (e) {

}
assetURLPrefix = assetURLPrefix || '/';
if (assetURLPrefix.charAt(assetURLPrefix.length - 1) !== '/') {
	assetURLPrefix += '/';
}

// 解析静态资源路径
exports.resolvePath = (function() {
	const reIsURL = /^(?:[a-z]+:)?\/\//;

	return function(scope, option) {
		const assetPath = option.params[0];
		let result;
		if (/^\./.test(assetPath)) {
			result = this.name.split('/');
			// 解析相对路径，先拿掉最后的文件名
			result.pop();
			assetPath.split('/').forEach(function(item) {
				switch (item) {
					case '.':
						// 当前目录，不用处理
						break;

					case '..':
						// 上级目录，拿掉一层文件夹
						result.pop();
						break;

					default:
						// 下级目录或文件名
						result.push(item);
				}
			});
		} else {
			result = assetPath;
		}

		result = result.join('/').replace(assetURLPrefix, '');

		if (reIsURL.test(result)) {
			return result;
		} else {
			result = result.replace(/^\//, '');
			return assetURLPrefix + result.replace(/\.\w+$/, function(match) {
				return md5Map[result] ? ('.' + md5Map[result] + match) : match;
			});
		}
	};
})();


// JSON序列化
exports.jsonEncode = (scope, option) => {
	return JSON.stringify(option.params[0]);
};

function toString(str) {
	return str == null ? '' : String(str);
}

// 换行符转为 <br />
exports.nl2br = (scope, option) => {
	return toString(option.params[0]).replace(/\r?\n/g, '<br />');
};

// 把空白替换成 &nbsp;
exports.space2nbsp = (scope, option) => {
	return toString(option.params[0]).replace(/\s{2,}/g, function(match) {
		return new Array(match.length + 1).join('&nbsp;');
	});
};


// 编码HTML实体
exports.escape = (function() {
	// HTML特殊字符及其对应的编码内容
	let reEntity = [];
	const entityMap = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		'\'': '&#x27;'
	};
	for (let key in entityMap) { reEntity.push(key); }
	reEntity = new RegExp('[' + reEntity.join('') + ']', 'g');

	return (scope, option) => {
		return toString(option.params[0]).replace(reEntity, (match) => {
			return entityMap[match];
		});
	};
})();


// 对象是否存在
exports.exists = (scope, option) => {
	const obj = option.params[0];
	let result = obj != null;
	if (result) {
		if (Array.isArray(obj)) {
			result = obj.length > 0;
		} else if (typeof obj === 'string') {
			result = obj.trim() !== '';
		}
	}
	return result;
};


// 格式化日期
exports.formatDate = (scope, option) => {
	return util.formatDate(option.params[0], option.params[1]);
};

// 格式化日期为距离现在多长时间的格式
exports.formatDateFromNow = (scope, option) => {
	return util.formatDateFromNow(option.params[0]);
};


// 转换成URL参数
exports.toQueryString = (scope, option) => {
	const data = option.params[0];
	const addPagePlaceholder = option.params[1];

	const result = [];
	for (let d in data) {
		if (data[d] != null && data[d] !== '') {
			result.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
		}
	}

	// 增加页码参数占位符
	if (addPagePlaceholder) { result.push('page={{page}}'); }

	return result.join('&');
};

// 创建分页条数据模型
exports.createPaginator = (scope, option) => {
	const currentPage = parseInt(option.params[0]) || 1;
	const totalPages = parseInt(option.params[1]);
	const href = option.params[2] || '?page={{page}}';

	const howManyPageItems = 7;
	const howManyPageItemsPerSide = parseInt((howManyPageItems - 1) / 2);
	const data = [];

	let start = currentPage - howManyPageItemsPerSide;
	let end = currentPage + howManyPageItemsPerSide;
	const startOverflow = start - 1;
	const endOverflow = totalPages - end;

	// 把左侧剩余的页码额度移到右侧
	if (startOverflow < 0) {
		start = 1;
		end = Math.min(totalPages, end - startOverflow);
	}
	// 把右侧剩余的页码移到左侧
	if (endOverflow < 0) {
		end = totalPages;
		if (startOverflow > 0) { start = Math.max(1, start + endOverflow); }
	}

	// 处理 howManyPageItems 为双数，减一后除不尽的情况
	if (howManyPageItems % 2 === 0) {
		if (start > 1) {
			start--;
		} else if (end < totalPages) {
			end++;
		}
	}

	// 开始页码大于1，但第一页一定要显示，所以要减一个额度
	if (start > 1) { start++; }
	// 结束页码小于总页数，但最后一页一定要显示，所以要减一个额度
	if (end < totalPages) { end--; }

	// 补充第一页到开始页
	if (start - 1) {
		data.push({
			page: 1,
			current: false
		}, {
			page: '...'
		});
	}

	for (let i = start; i <= end; i++) {
		data.push({
			page: i,
			current: i == currentPage
		});
	}

	// 补充结束页到末页
	if (totalPages - end) {
		data.push({
			page: '...'
		}, {
			page: totalPages,
			current: false
		});
	}

	let prevHref, nextHref;
	data.forEach(function(d) {
		if (typeof d.page === 'number') {
			d.href = href.replace('{{page}}', d.page);
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