const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const core = require('./core');
const Category = require('./category').Model;
const User = require('./user').Model;


const Article = exports.Model = core.define('article', {
	articleid: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},

	title: { type: Sequelize.STRING },

	'title_en': { type: Sequelize.STRING },

	keywords: { type: Sequelize.STRING },

	categoryid: { type: Sequelize.SMALLINT },

	summary: { type: Sequelize.TEXT },

	content: { type: Sequelize.TEXT },

	weight: { type: Sequelize.SMALLINT },

	userid: { type: Sequelize.INTEGER },

	state: { type: Sequelize.TINYINT },

	pubtime: { type: Sequelize.DATE },

	totalviews: { type: Sequelize.BIGINT },

	totalcomments: { type: Sequelize.BIGINT }

}, {
	timestamps: false,
	freezeTableName: true,

	getterMethods: {
		href() {
			let href = '/article/detail/' + this.articleid;
			if (this.title_en) {
				href += '/' + this.title_en;
			}
			return href;
		}
	}
});

Article.belongsTo(Category, { foreignKey: 'categoryid' });
Article.belongsTo(User, { foreignKey: 'userid' });


// 创建和更新时的有效字段
const fields = [
	'title',
	'title_en',
	'keywords',
	'categoryid',
	'summary',
	'content',
	'weight',
	'userid',
	'state',
	'pubtime'
];

exports.create = async(data) => {
	const result = await Article.create(data, {
		fields
	});
	return result ? result.toJSON() : result;
};

exports.update = async(data, id) => {
	return (await Article.update(data, {
		where: {
			articleid: {
				[Op.eq]: id
			}
		}
	}))[0];
};


exports.delete = async(ids, userid) => {
	const where = {
		articleid: {
			[Op.in]: ids
		}
	};
	if (userid) {
		where.userid = {
			[Op.eq]: userid
		};
	}
	return Article.destroy({ where });
};


exports.addViews = async(id) => {
	return (await Article.update({
		totalviews: Sequelize.literal('totalviews + 1')
	}, {
		where: {
			articleid: {
				[Op.eq]: id
			}
		}
	}))[0];
};


exports.read = async(id) => {
	const result = await Article.findOne({
		where: {
			articleid: {
				[Op.eq]: id
			}
		}
	});
	return result ? result.toJSON() : result;
};


exports.list = async(pageSize, page, params) => {
	const where = {
		weight: {
			[Op.and]: {}
		}
	};
	let userWhere;

	if (params) {
		// 最小权重
		if (params.minWeight != null) {
			where.weight[Op.and][Op.gte] = params.minWeight;
		}
		// 最大权重
		if (params.maxWeight != null) {
			where.weight[Op.and][Op.lte] = params.maxWeight;
		}
		// 分类编号
		if (params.categoryid != null) {
			where.categoryid = {
				[Op.eq]: params.categoryid
			};
		} else if (params.categoryids != null) {
			where.categoryid = {
				[Op.in]: params.categoryids
			};
		}
		// 用户编号
		if (params.userid != null) {
			where.userid = {
				[Op.eq]: params.userid
			};
		}
		// 发布状态
		if (params.state != null) {
			where.state = {
				[Op.eq]: params.state
			};
		}
		// 用户名或昵称
		if (params.name) {
			userWhere = {
				[Op.or]: {
					username: {
						[Op.like]: `%${ params.name }%`
					},
					nickname: {
						[Op.like]: `%${ params.name }%`
					}
				}
			};
		}
		// 标题
		if (params.title) {
			where.title = {
				[Op.like]: `%${ params.title }%`
			};
		}
	}

	const result = await Article.findAndCountAll({
		where,
		attributes: {
			exclude: ['content']
		},
		include: [{
			model: Category,
			attributes: ['categoryid', 'categoryname', 'categoryname_en']
		}, {
			model: User,
			attributes: ['username', 'nickname'],
			where: userWhere
		}],
		order: [
			['pubtime', 'DESC'],
			['weight', 'DESC']
		],
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


exports.adjacent = async(articleid, categoryid, prevOrNext) => {
	const result = await Article.findOne({
		attributes: {
			exclude: ['summary', 'content']
		},
		where: {
			articleid: {
				[prevOrNext ? Op.gt : Op.lt]: articleid
			},
			categoryid: {
				[Op.eq]: categoryid
			},
			state: {
				[Op.eq]: 1
			}
		},
		order: [
			['pubtime', prevOrNext ? 'ASC' : 'DESC']
		]
	});
	return result ? result.toJSON() : result;
};