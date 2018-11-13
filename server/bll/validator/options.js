exports.validate = (options) => {
	if (!options.sitename) { return '网站名称不能为空'; }
	if (!options.siteurl) { return '网站URL不能为空'; }
	if ([0, 1].indexOf(options.isopen) === -1) { return '网站开关参数错误'; }

	// 容错处理，中文逗号替换为英文逗号
	options.keywords = options.keywords.replace(/，/g, ',');
};