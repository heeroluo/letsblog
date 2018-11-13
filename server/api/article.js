const categoryBLL = require('../bll/category');
const articleBLL = require('../bll/article');
const { createError } = require('../../assets/common/util/util');



exports['list'] = async(ctx) => {
	const categoryid = parseInt(ctx.request.query.categoryid) || 0;
	const page = parseInt(ctx.request.query.page) || 1;

	let result;

	if (!categoryid && page === 1) {
		result = await articleBLL.getHomePageList();

	} else {
		const params = {};

		const category = await categoryBLL.read(categoryid);
		if (category && category.weight > 0) {
			params.categoryid = categoryid;
		} else {
			throw createError('分类不存在或不可见', 404);
		}

		// 只加载可见文章
		params.minWeight = 1;
		params.state = 1;

		result = await articleBLL.list(10, page, params);
	}

	return result;
};