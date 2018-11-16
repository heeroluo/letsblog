const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const core = require('./core');
const UserGroup = require('./usergroup').Model;


const User = exports.Model = core.define('user', {
	userid: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},

	username: {
		type: Sequelize.STRING
	},

	password: {
		type: Sequelize.CHAR
	},

	groupid: {
		type: Sequelize.SMALLINT
	},

	nickname: {
		type: Sequelize.STRING
	},

	email: {
		type: Sequelize.STRING
	},

	regtime: {
		type: Sequelize.DATE
	},

	lastactivity: {
		type: Sequelize.DATE
	},

	lastip: {
		type: Sequelize.STRING
	},

	totalarticles: {
		type: Sequelize.INTEGER
	},

	totalcomments: {
		type: Sequelize.BIGINT
	}
}, {
	timestamps: false,
	freezeTableName: true,

	getterMethods: {
		name() {
			return this.nickname || this.username;
		}
	}
});


User.belongsTo(UserGroup, {
	foreignKey: 'groupid'
});


exports.create = async(data) => {
	const result = await User.create(data, {
		fields: [
			'username',
			'password',
			'groupid',
			'nickname',
			'email',
			'regtime',
			'lastactivity',
			'lastip'
		]
	});
	return result ? result.toJSON() : result;
};


exports.readByUserId = async(id) => {
	const result = await User.findOne({
		where: {
			userid: {
				[Op.eq]: id
			}
		}
	});
	return result ? result.toJSON() : result;
};

exports.readByUsername = async(username, password) => {
	const where = {
		username: { [Op.eq]: username }
	};
	if (password != null) {
		where.password = { [Op.eq]: password };
	}

	const result = await User.findOne({
		where
	});
	return result ? result.toJSON() : result;
};


exports.updateProfile = async(data, id) => {
	return (await User.update(data, {
		fields: [
			'groupid',
			'nickname',
			'email'
		],
		where: {
			userid: {
				[Op.eq]: id
			}
		}
	}))[0];
};

exports.updateActivity = async(lastactivity, lastip, id) => {
	return (await User.update({
		lastactivity,
		lastip
	}, {
		where: {
			userid: {
				[Op.eq]: id
			}
		}
	}))[0];
};

exports.updatePassword = async(password, username) => {
	return (await User.update({
		password
	}, {
		where: {
			username: {
				[Op.eq]: username
			}
		}
	}))[0];
};


exports.delete = async(ids) => {
	return User.destroy({
		where: {
			userid: {
				[Op.in]: ids
			}
		}
	});
};


exports.listByName = async(username, nickname) => {
	const names = [];
	if (username) { names.push(username); }
	if (nickname) { names.push(nickname); }

	return (await User.findAll({
		where: {
			[Op.or]: {
				username: {
					[Op.in]: names
				},
				nickname: {
					[Op.in]: names
				}
			}
		}
	})).map((item) => {
		return item.toJSON();
	});
};

exports.list = async(pageSize, page, params) => {
	const where = {};
	if (params) {
		if (params.groupid) {
			where.groupid = {
				[Op.eq]: params.groupid
			};
		}
		if (params.name) {
			where[Op.or] = {
				username: {
					[Op.like]: `%${ params.name }%`
				},
				nickname: {
					[Op.like]: `%${ params.name }%`
				}
			};
		}
	}

	const result = await User.findAndCountAll({
		where,
		attributes: {
			exclude: ['password']
		},
		include: [{
			model: UserGroup,
			attributes: ['groupname']
		}],
		order: [['userid', 'DESC']],
		limit: pageSize,
		offset: (page - 1) * pageSize
	});

	return {
		rowCount: result.count,
		pageCount: Math.ceil(result.count / pageSize),
		page,
		rows: result.rows.map((item) => {
			return item.toJSON();
		})
	};
};