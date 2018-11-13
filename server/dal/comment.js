const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const core = require('./core');
const User = require('./user').Model;
const Article = require('./article').Model;


const Comment = exports.Model = core.define('comment', {
	commentid: {
		type: Sequelize.BIGINT,
		primaryKey: true,
		autoIncrement: true
	},

	userid: { type: Sequelize.INTEGER },

	'user_nickname': { type: Sequelize.STRING },

	'user_email': { type: Sequelize.STRING },

	'user_qq': { type: Sequelize.STRING },

	articleid: { type: Sequelize.INTEGER },

	content: { type: Sequelize.TEXT },

	pubtime: { type: Sequelize.DATE },

	ip: { type: Sequelize.STRING },

	state: { type: Sequelize.TINYINT }

}, {
	timestamps: false,
	freezeTableName: true
});


Comment.belongsTo(Article, { foreignKey: 'articleid' });
Comment.belongsTo(User, { foreignKey: 'userid' });


exports.create = async(data) => {
	const result = await Comment.create(data, {
		fields: [
			'userid',
			'user_nickname',
			'user_email',
			'user_qq',
			'articleid',
			'content',
			'pubtime',
			'ip',
			'state'
		]
	});
	return result ? result.toJSON() : result;
};

exports.updateState = async(state, ids) => {
	return (await Comment.update({
		state
	}, {
		where: {
			commentid: {
				[Op.in]: ids
			}
		}
	}))[0];
};


exports.deleteByCommentIds = async(ids) => {
	return Comment.destroy({
		where: {
			commentid: {
				[Op.in]: ids
			}
		}
	});
};

exports.deleteByArticleIds = async(ids) => {
	return Comment.destroy({
		where: {
			articleid: {
				[Op.in]: ids
			}
		}
	});
};


exports.list = async(pageSize, page, params) => {
	const where = {};
	let articleWhere;

	if (params) {
		// 文章id
		if (params.articleid != null) {
			where.articleid = {
				[Op.eq]: params.articleid
			};
		}
		// 状态
		if (params.state != null) {
			where.state = {
				[Op.eq]: params.state
			};
		}
		// 文章标题
		if (params.title != null) {
			articleWhere = {
				title: {
					[Op.like]: `%${ params.title }%`
				}
			};
		}
	}

	const options = {
		where,
		order: [['pubtime', 'ASC']]
	};

	const rowCount = await Comment.count(options);
	const pageCount = Math.ceil(rowCount / pageSize);
	if (page === -1) { page = pageCount; }

	options.include = [{
		model: Article,
		attributes: ['title', 'title_en'],
		where: articleWhere
	}, {
		model: User,
		attributes: ['nickname', 'email']
	}];
	options.limit = pageSize;
	options.offset = (page - 1) * pageSize;

	const rows = await Comment.findAll(options);

	return {
		rowCount: rowCount,
		pageCount,
		page,
		rows: rows.map((item) => { return item.toJSON(); })
	};
};


exports.getTotalCommentsAfterTime = async(time, ip) => {
	return Comment.count({
		where: {
			pubtime: {
				[Op.gte]: time
			},
			ip: {
				[Op.eq]: ip
			}
		}
	});
};


exports.getTotalPendingReviews = async() => {
	return Comment.count({
		where: {
			state: {
				[Op.eq]: 0
			}
		}
	});
};