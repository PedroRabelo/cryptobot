const settingsModel = require('../models/settingsModel');
const bcrypt = require('bcryptjs');
const crypto = require('../utils/crypto');

const settingsCache = {};
async function getSettingsDecrypted(id) {
  let settings = settingsCache[id];

  if (!settings) {
    settings = await getSettings(id);
    settings.secretKey = crypto.decrypt(settings.secretKey);
    settingsCache[id] = settings;
  }

  return settings;
}

function clearSettingsCache(id) {
  settingsCache[id] = null;
}

function getSettingsByEmail(email) {
  return settingsModel.findOne({ where: { email } });
}

function getSettings(id) {
  return settingsModel.findOne({ where: { id } });
}

async function getDefaultSettings() {
  const settings = await settingsModel.findOne({ where: { id: process.env.DEFAULT_SETTINGS_ID || 1 } });
  return getSettingsDecrypted(settings.id);
}

async function updateSettings(id, newSettings) {
  const currentSettings = await getSettings(id);

  if (newSettings.email && newSettings.email !== currentSettings.email)
    currentSettings.email = newSettings.email;

  if (newSettings.password)
    currentSettings.password = bcrypt.hashSync(newSettings.password);

  if (newSettings.accessKey && newSettings.accessKey !== currentSettings.accessKey)
    currentSettings.accessKey = newSettings.accessKey;

  if (newSettings.apiUrl && newSettings.apiUrl !== currentSettings.apiUrl)
    currentSettings.apiUrl = newSettings.apiUrl;

  if (newSettings.secretKey)
    currentSettings.secretKey = crypto.encrypt(newSettings.secretKey);

  if (newSettings.streamUrl && newSettings.streamUrl !== currentSettings.streamUrl)
    currentSettings.streamUrl = newSettings.streamUrl;

  await currentSettings.save();
}

module.exports = {
  getSettingsDecrypted,
  getSettingsByEmail,
  getSettings,
  updateSettings,
  getDefaultSettings
}