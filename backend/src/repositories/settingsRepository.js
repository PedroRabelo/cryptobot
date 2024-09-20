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

  if (newSettings.phone && newSettings.phone !== currentSettings.phone)
    currentSettings.phone = newSettings.phone;

  if (newSettings.password)
    currentSettings.password = bcrypt.hashSync(newSettings.password);

  if (newSettings.accessKey && newSettings.accessKey !== currentSettings.accessKey)
    currentSettings.accessKey = newSettings.accessKey;

  if (newSettings.apiUrl && newSettings.apiUrl !== currentSettings.apiUrl)
    currentSettings.apiUrl = newSettings.apiUrl;

  if (newSettings.secretKey) {
    currentSettings.secretKey = crypto.encrypt(newSettings.secretKey);
    clearSettingsCache(id);
  }

  if (newSettings.streamUrl && newSettings.streamUrl !== currentSettings.streamUrl)
    currentSettings.streamUrl = newSettings.streamUrl;

  if (newSettings.sendGridKey && newSettings.sendGridKey !== currentSettings.sendGridKey)
    currentSettings.sendGridKey = newSettings.sendGridKey;

  if (newSettings.twilioSid && newSettings.twilioSid !== currentSettings.twilioSid)
    currentSettings.twilioSid = newSettings.twilioSid;

  if (newSettings.twilioToken && newSettings.twilioToken !== currentSettings.twilioToken)
    currentSettings.twilioToken = newSettings.twilioToken;

  if (newSettings.twilioPhone && newSettings.twilioPhone !== currentSettings.twilioPhone)
    currentSettings.twilioPhone = newSettings.twilioPhone;

  await currentSettings.save();
}

module.exports = {
  getSettingsDecrypted,
  getSettingsByEmail,
  getSettings,
  updateSettings,
  getDefaultSettings
}