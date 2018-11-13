const Sequelize = require('sequelize');
const core = require('./core');


const Options = exports.Model = core.define('options', {
	sitename: {
		type: Sequelize.STRING
	},

	siteurl: {
		type: Sequelize.STRING
	},

	keywords: {
		type: Sequelize.STRING
	},

	description: {
		type: Sequelize.TEXT
	},

	isopen: {
		type: Sequelize.TINYINT
	},

	tipstext: {
		type: Sequelize.TINYINT
	},

	statcode: {
		type: Sequelize.TINYINT
	}
}, {
	timestamps: false,
	freezeTableName: true
});

// options表没有主键
Options.removeAttribute('id');


exports.read = async() => {
	const result = await Options.findOne();
	return result ? result.toJSON() : result;
};

exports.update = async(data) => {
	return (await Options.update(data, {
		where: {}
	}))[0];
};