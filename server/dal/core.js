const dbConfig = require('../../db.config');
const Sequelize = require('sequelize');

module.exports = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
	host: dbConfig.host,
	dialect: 'mysql',

	define: {
		freezeTableName: true,
		timestamps: false
	},

	pool: {
		max: 10
	},

	// 时区
	timezone: '+08:00',

	// http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
	operatorsAliases: false
});