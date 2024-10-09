const Sequelize = require('sequelize');
const database = require('../db');

const orderTemplateModel = require('./orderTemplateModel');
const withdrawTemplateModel = require('./withdrawTemplateModel');

const ActionModel = database.define('action', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  automationId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  orderTemplateId: Sequelize.INTEGER,
  withdrawTemplateId: Sequelize.INTEGER,
  type: {
    type: Sequelize.STRING,
    allowNull: false
  },
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE
})

ActionModel.belongsTo(orderTemplateModel, {
  foreignKey: 'orderTemplateId'
})
ActionModel.belongsTo(withdrawTemplateModel, {
  foreignKey: 'withdrawTemplateId'
})

module.exports = ActionModel;