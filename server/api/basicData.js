const optionsBLL = require('../bll/options');
const categoryBLL = require('../bll/category');
const linkBLL = require('../bll/link');


exports['/'] = async() => {
	return {
		options: await optionsBLL.read(),
		categories: await categoryBLL.list(1),
		links: await linkBLL.list(1)
	};
};