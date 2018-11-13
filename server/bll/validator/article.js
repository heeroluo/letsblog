const { isWeight, isEnTitle, isAutoId } = require('./common');


// 创建和更新数据前的主要属性验证
exports.validate = (article) => {
	if (!article.title) {
		return '标题不能为空';
	} else if (article.title_en && !isEnTitle(article.title_en)) {
		return '英文标题只能包含小写字母、数字和连字符';
	} else if (!article.categoryid) {
		return '分类不能为空';
	} else if (!isAutoId(article.categoryid)) {
		return '无效的分类编号';
	} else if (!isWeight(article.weight)) {
		return '权重必须为0-255间的整数';
	} else if ([0, 1].indexOf(article.state) === -1) {
		return '无效的状态参数';
	}
};

// 检查列表查询参数的合法性
exports.checkListParams = (params) => {
	if (params.minWeight != null && !isWeight(params.minWeight)) {
		return '无效的最小权重';
	} else if (params.maxWeight != null && !isWeight(params.maxWeight)) {
		return '无效的最大权重';
	} else if (
		params.minWeight != null &&
		params.maxWeight != null &&
		parseInt(params.minWeight) > parseInt(params.maxWeight)
	) {
		return '最小权重不能大于最大权重';
	} else if (params.categoryid != null && !isAutoId(params.categoryid)) {
		return '无效的分类编号';
	} else if (params.userid != null && !isAutoId(params.userid)) {
		return '无效的用户编号';
	} else if (
		params.categoryids &&
		params.categoryids.some((id) => {
			return !isAutoId(id);
		})
	) {
		return '无效的分类编号';
	}
};