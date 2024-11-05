const Sequelize = require('sequelize');
const database = require('../db');
const AutomationModel = require('./automationModel');
const MonitorModel = require('./monitorModel');
const OrderTemplateModel = require('./orderTemplateModel');
const WithdrawTemplateModel = require('./withdrawTemplateModel');
const OrderModel = require('./orderModel');

const userModel = database.define('user', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  name: Sequelize.STRING,
  email: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  limitId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  phone: Sequelize.STRING,
  accessKey: Sequelize.STRING,
  secretKey: Sequelize.STRING,
  telegramChat: Sequelize.STRING,
  isActive: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE
}, {
  indexes: [{
    unique: true,
    fields: ['email']
  }]
})

userModel.hasMany(AutomationModel, {
  foreignKey: 'userId'
});

userModel.hasMany(MonitorModel, {
  foreignKey: 'userId'
});

userModel.hasMany(OrderTemplateModel, {
  foreignKey: 'userId'
});

userModel.hasMany(WithdrawTemplateModel, {
  foreignKey: 'userId'
});

userModel.hasMany(OrderModel, {
  foreignKey: 'userId'
});

module.exports = userModel