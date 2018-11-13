const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const core = require('./core');


const Category = exports.Model = core.define('category', {
	categoryid: {
		type: Sequelize.SMALLINT,
		primaryKey: true,
		autoIncrement: true
	},

	categoryname: { type: Sequelize.CHAR },

	'categoryname_en': { type: Sequelize.CHAR },

	weight: { type: Sequelize.TINYINT },

	totalarticles: { type: Sequelize.INTEGER }

}, {
	timestamps: false,
	freezeTableName: true,

	getterMethods: {
		href() {
			let href = '/article/list/' + this.categoryid;
			if (this['categoryname_en']) {
				href += '/' + this['categoryname_en'];
			}
			return href;
		}
	}
});


// 创建和更新时的有效字段
const fields = ['categoryname', 'categoryname_en', 'weight'];

exports.create = async(data) => {
	const result = await Category.create(data, {
		fields
	});
	return result ? result.toJSON() : result;
};

exports.update = async(data, id) => {
	return (await Category.update(data, {
		fields,
		where: {
			categoryid: {
				[Op.eq]: id
			}
		}
	}))[0];
};

exports.delete = async(id) => {
	return (await Category.destroy({
		where: {
			categoryid: {
				[Op.eq]: id
			}
		}
	}))[0];
};

exports.list = async() => {
	return (await Category.findAll({
		order: [['weight', 'DESC']]
	})).map((item) => {
		return item.toJSON();
	});
};