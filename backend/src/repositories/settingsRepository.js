const settingsModel = require('../models/settingsModel');
const bcrypt = require('bcryptjs');

function getSettingsByEmail(email) {
  return settingsModel.findOne({ where: { email } });
}

function getSettings(id) {
  return settingsModel.findOne({ where: { id } });
}

async function getDefaultSettings() {
  return await settingsModel.findOne({ where: { id: process.env.DEFAULT_SETTINGS_ID || 1 } });
}

async function updateSettings(id, newSettings) {
  const currentSettings = await getSettings(id);

  if (newSettings.email && newSettings.email !== currentSettings.email)
    currentSettings.email = newSettings.email;

  if (newSettings.phone && newSettings.phone !== currentSettings.phone)
    currentSettings.phone = newSettings.phone;

  if (newSettings.password)
    currentSettings.password = bcrypt.hashSync(newSettings.password);

  if (newSettings.apiUrl && newSettings.apiUrl !== currentSettings.apiUrl)
    currentSettings.apiUrl = newSettings.apiUrl;

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

  if (newSettings.telegramBot && newSettings.telegramBot !== currentSettings.telegramBot)
    currentSettings.telegramBot = newSettings.telegramBot;

  if (newSettings.telegramToken && newSettings.telegramToken !== currentSettings.telegramToken)
    currentSettings.telegramToken = newSettings.telegramToken;

  if (newSettings.telegramChat && newSettings.telegramChat !== currentSettings.telegramChat)
    currentSettings.telegramChat = newSettings.telegramChat;

  await currentSettings.save();
  return currentSettings;
}

module.exports = {
  getSettingsByEmail,
  getSettings,
  updateSettings,
  getDefaultSettings
}