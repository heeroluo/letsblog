const { isWeight, isEnTitle } = require('./common');


exports.validate = (category) => {
	if (!category.categoryname) {
		return '分类名不能为空';
	}
	if (category.categoryname_en && !isEnTitle(category.categoryname_en)) {
		return '英文分类名只能包含小写字母、数字和连字符';
	}
	if (!isWeight(category.weight)) {
		return '权重必须为0-255间的整数';
	}
};