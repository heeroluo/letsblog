const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const core = require('./core');


const Link = exports.Model = core.define('link', {
	linkid: {
		type: Sequelize.SMALLINT,
		primaryKey: true,
		autoIncrement: true
	},

	linkname: { type: Sequelize.CHAR },

	siteurl: { type: Sequelize.CHAR },

	logourl: {
		type: Sequelize.CHAR,
		defaultValue: ''
	},

	introduction: { type: Sequelize.CHAR },

	weight: { type: Sequelize.TINYINT }

}, {
	timestamps: false,
	freezeTableName: true
});


const fields = [
	'linkname',
	'siteurl',
	'logourl',
	'introduction',
	'weight'
];

exports.create = async(data) => {
	const result = await Link.create(data, {
		fields
	});
	return result ? result.toJSON() : result;
};

exports.update = async(data, id) => {
	return (await Link.update(data, {
		fields,
		where: {
			linkid: {
				[Op.eq]: id
			}
		}
	}))[0];
};

exports.delete = async(id) => {
	return Link.destroy({
		where: {
			linkid: {
				[Op.eq]: id
			}
		}
	});
};

exports.list = async() => {
	const result = await Link.findAll({
		order: [['weight', 'DESC']]
	});
	return result.map((item) => {
		return item.toJSON();
	});
};