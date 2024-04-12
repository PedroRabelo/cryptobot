'use strict';
const bcrypt = require('bcryptjs');
const { encrypt } = require('../src/utils/crypto');
require('dotenv').config();

module.exports = {
  async up(queryInterface, Sequelize) {
    const settingsId = await queryInterface.rawSelect('settings', { where: {}, limit: 1 }, ['id']);
    if (!settingsId) {
      return queryInterface.bulkInsert('settings', [{
        email: process.env.DEFAULT_SETTINGS_EMAIL,
        password: bcrypt.hashSync(process.env.DEFAULT_SETTINGS_PWD),
        apiUrl: 'https://testnet.binance.vision/api',
        accessKey: process.env.DEFAULT_SETTINGS_ACCESS_KEY,
        secretKey: encrypt(process.env.DEFAULT_SETTINGS_SECRET_KEY),
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
    }
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('settings', null, {});
  }
};
