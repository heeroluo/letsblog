/*!
 * LetsBlog
 * Entity model creator
 * Released under MIT license
 */

'use strict';


var util = require('../lib/util');


var entityProto = {
	// 转换成数据库记录
	toDbRecord: function() {
		var t = this, record = { }, props = this._props;
		if (props) {
			props.forEach(function(prop) {
				record[prop.name] = t[prop.name];
			});
		}

		return t._toDbRecord(record) || record;
	},

	// 可以在此方法中进一步修改record
	_toDbRecord: function(record) { return record; },

	// 转换为纯数据对象
	toPureData: function() {
		var data = { }, temp;
		for (var i in this) {
			if ( this.hasOwnProperty(i) && !/^_/.test(i) ) {
				if (this[i] !== null && typeof this[i].toPureData === 'function') {
					temp = this[i].toPureData();
				} else {
					temp = this[i];
				}
				data[i] = temp;
			}
		}
		return data;
	}
};


/**
 * 实体模型类
 * @class EntityModel
 * @constructor
 * @exports
 * @param {Array<Object>} props 实体属性
 * @param {Function} [entityConstructor] 实体类构造函数
 * @param {Function} [entityMethods] 实体类方法
 */
function EntityModel(props, entityConstructor, entityMethods) {
	// 重载，允许省略entityConstructor
	if (!entityMethods && typeof entityConstructor === 'object') {
		entityMethods = entityConstructor;
		entityConstructor = null;
	}

	var allProps = [ ],
		propsToInsert = [ ],
		propsToUpdate = [ ],
		primaryKeys = [ ];

	// 分析出主键以及插入、更新数据所需要属性
	props.forEach(function(prop) {
		var propObj = { };
		if (typeof prop === 'string') {
			propObj.name = prop;
		} else {
			propObj.name = prop.name;
			propObj.type = prop.type;
		}
		propObj.type = propObj.type || 'string';
		// 为防止意外修改，将其冻结
		Object.freeze(propObj);

		if (!prop.isDbGenerated) { propsToInsert.push(propObj); }
		if (!prop.isUpdateIgnored) { propsToUpdate.push(propObj); }
		if (prop.isPrimary) { primaryKeys.push(propObj); }

		allProps.push(propObj);
	});

	// 为防止意外修改，将其冻结
	this._allProps = Object.freeze(allProps);
	this._propsToInsert = Object.freeze(propsToInsert);
	this._propsToUpdate = Object.freeze(propsToUpdate);
	this._primaryKeys = Object.freeze(primaryKeys);

	// 实体类
	this._Class = function(source, props) {
		if (source) {
			for (var p in source) {
				if ( source.hasOwnProperty(p) ) { this[p] = source[p]; }
			}
		}
		if (props) {
			this._props = Object.freeze( props.slice() );
		}

		if (entityConstructor) { entityConstructor.apply(this); }
	};
	util.extend(this._Class.prototype, entityProto, entityMethods);
}

util.extend(EntityModel.prototype, {
	/**
	 * 获取实体模型属性集合
	 * @method props
	 * @for EntityModel
	 * @param {String} type 属性类型：
	 *   insert-插入记录所需属性；
	 *   update-更新记录所需属性；
	 *   primary-主键属性；
	 *   其他-所有属性
	 * @return {Array<Object>} 属性集合
	 */
	props: function(type) {
		switch (type) {
			case 'insert':
				return this._propsToInsert;

			case 'update':
				return this._propsToUpdate;

			case 'primary':
				return this._primaryKeys;
			
			default:
				return this._allProps;
		}
	},

	/**
	 * 创建实体对象
	 * @method createObj
	 * @for EntityModel
	 * @param {Object} source 数据来源，如果为null，则创建属性值均为空的默认实体对象
	 * @param {String} type 属性类型：
	 *   insert-插入记录所需属性；
	 *   update-更新记录所需属性；
	 *   primary-主键属性；
	 *   其他-所有属性
	 * @return {Object} 实体对象
	 */
	createEntity: function(source, type) {
		var obj = { }, props = this.props(type);
		if (props) {
			props.forEach(function(prop) {
				var val;
				if (source) {
					// 兼容直接从req.body获取属性值
					val = typeof source.body === 'object' ?
						source.body[prop.name] : source[prop.name];
				} else {
					val = '';
				}

				if (prop.type) { val = util.convert(val, prop.type); }

				obj[prop.name] = val;
			});
		}

		// 没有指定属性类型时，把数据源的其他属性也加到对象中
		if (!type && source && typeof source.body !== 'object') {
			for (var p in source) {
				if ( source.hasOwnProperty(p) && !(p in obj) ) {
					obj[p] = source[p];
				}
			}
		}

		return new this._Class(obj, props);
	}
});


module.exports = EntityModel;