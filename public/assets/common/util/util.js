/**
 * 格式化日期
 * @method formatDate
 * @param {Date} date 日期
 * @param {String} formation 日期格式
 * @return {String} 格式化后的日期字符串
 */
exports.formatDate = function(date, formation) {
	var values = {
		Y: date.getFullYear(),
		M: date.getMonth() + 1,
		D: date.getDate(),
		h: date.getHours(),
		m: date.getMinutes(),
		s: date.getSeconds()
	};

	return formation.replace(/Y+|M+|D+|h+|m+|s+/g, function(match) {
		var result = values[ match[0] ];
		if (match.length > 1 && result.toString().length !== match.length) {
			result = ((new Array(match.length)).join('0') + result).slice(-match.length);
		}
		return result;
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