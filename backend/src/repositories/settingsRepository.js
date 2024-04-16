const settingsModel = require('../models/settingsModel');

function getSettingsByEmail(email) {
  return settingsModel.findOne({ where: { email } });
}

function getSettings(id) {
  return settingsModel.findOne({ where: { id } });
}

module.exports = {
  getSettingsByEmail,
  getSettings
}