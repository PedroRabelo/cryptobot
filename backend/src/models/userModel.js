const Sequelize = require('sequelize');
const database = require('../db');

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

module.exports = userModel