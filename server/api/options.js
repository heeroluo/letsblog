const optionsDAL = require('../bll/options');


exports.read = async() => {
	return optionsDAL.read();
};