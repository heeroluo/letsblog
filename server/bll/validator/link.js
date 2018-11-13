const { isWeight } = require('./common');


// 创建和更新数据前的验证
exports.validate = (link) => {
	if (!link.linkname) { return '站名不能为空'; }
	if (!link.siteurl) { return '链接不能为空'; }
	if (!isWeight(link.weight)) { return '权重必须为0-255间的整数'; }
};