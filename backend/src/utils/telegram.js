module.exports = (settings, message) => {
  if (!settings) throw new Error('The settings object is required to send Telegram messages!');
  if (!settings.telegramToken
    || !settings.telegramChat)
    throw new Error('The Telegram settings are not defined!');

  const { Telegraf } = require('telegraf');

  const bot = new Telegraf(settings.telegramToken);
  return bot.telegram.sendMessage(settings.telegramChat, message);
}