// 获取指定Model的属性集合
const attrCache = new Map();
function getAttributes(Model) {
	if (!attrCache.get(Model)) {
		const attrs = Model.attributes;
		const result = {};
		Object.keys(attrs).forEach((attrName) => {
			result[attrName] = attrs[attrName].type.key;
		});
		attrCache.set(Model, result);
	}
	return attrCache.get(Model);
}


// 类型转换函数
const typeConverter = {
	// 转换成数字
	number(val) { return Number(val) || 0; },

	// 转换成整数
	int(val) { return parseInt(Number(val)) || 0; },

	// 转换成日期
	date(val) {
		val = new Date(val);
		if (isNaN(val.getTime())) { val = new Date(0); }
		return val;
	},

	// 转换成字符串
	string(val) { return val == null ? '' : String(val); }
};

typeConverter.STRING =
typeConverter.CHAR =
typeConverter.TEXT = typeConverter.string;

typeConverter.TINYINT =
typeConverter.SMALLINT =
typeConverter.MEDIUMINT =
typeConverter.INTEGER =
typeConverter.BIGINT = typeConverter.number;

typeConverter.DATE = typeConverter.date;


// 从数据源创建模型对象
module.exports = (source, Model) => {
	const attrs = getAttributes(Model);
	const result = {};
	if (attrs) {
		Object.keys(attrs).forEach((attrName) => {
			result[attrName] = typeConverter[attrs[attrName]](
				source[attrName]
			);
		});
	}
	return result;
};