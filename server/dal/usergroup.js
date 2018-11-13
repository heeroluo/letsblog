const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const core = require('./core');


const UserGroup = exports.Model = core.define('usergroup', {
	groupid: {
		type: Sequelize.SMALLINT,
		primaryKey: true,
		autoIncrement: true
	},

	groupname: {
		type: Sequelize.CHAR
	},

	totalusers: { type: Sequelize.INTEGER },

	'perm_article': { type: Sequelize.TINYINT },
	'perm_comment': { type: Sequelize.TINYINT },
	'perm_manage_option': { type: Sequelize.TINYINT },
	'perm_manage_user': { type: Sequelize.TINYINT },
	'perm_manage_article': { type: Sequelize.TINYINT },
	'perm_manage_comment': { type: Sequelize.TINYINT }
}, {
	timestamps: false,
	freezeTableName: true
});


// 创建和更新时的有效字段
const fields = [
	'groupname',
	'perm_article',
	'perm_comment',
	'perm_manage_option',
	'perm_manage_user',
	'perm_manage_article',
	'perm_manage_comment'
];

exports.create = async(data) => {
	const result = await UserGroup.create(data, {
		fields
	});
	return result ? result.toJSON() : result;
};

exports.update = async(data, id) => {
	return (await UserGroup.update(data, {
		fields,
		where: {
			groupid: {
				[Op.eq]: id
			}
		}
	}))[0];
};

exports.delete = async(id) => {
	return UserGroup.destroy({
		where: {
			groupid: {
				[Op.eq]: id
			}
		}
	});
};

exports.list = async() => {
	return (await UserGroup.findAll()).map((item) => {
		return item.toJSON();
	});
};