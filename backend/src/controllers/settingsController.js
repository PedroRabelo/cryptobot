const settingsRepository = require('../repositories/settingsRepository');
const usersRepository = require('../repositories/usersRepository');
const appEm = require('../app-em');
const crypto = require('../utils/crypto')

async function getSettings(req, res, next) {
  const id = res.locals.token.id;
  const origin = req.headers.origin;

  let entity;
  if (origin === process.env.BEHOLDER_URL) {
    entity = await usersRepository.getUser(id);
    const settings = await settingsRepository.getDefaultSettings();
    entity.telegramBot = settings.telegramBot;
  } else if (origin === process.env.HYDRA_URL)
    entity = await settingsRepository.getSettings(id);
  else
    return res.sendStatus(403);

  const plainSettings = entity.get({ plain: true });
  delete plainSettings.password;
  delete plainSettings.secretKey;

  if (origin === process.env.BEHOLDER_URL)
    plainSettings.telegramBot = entity.telegramBot;

  res.json(plainSettings);
}

async function updateSettings(req, res, next) {
  const id = res.locals.token.id;
  const newSettings = req.body;
  const origin = req.headers.origin;

  let updatedEntity;
  if (origin === process.env.BEHOLDER_URL) {
    const currentUser = await usersRepository.getUser(id);
    updatedEntity = await usersRepository.updateUser(id, newSettings);
    if (updatedEntity.accessKey !== currentUser.accessKey || newSettings.secretKey) {
      const settings = await settingsRepository.getDefaultSettings();
      updatedEntity.secretKey = crypto.decrypt(updatedEntity.secretKey);
      await appEm.loadWallet(settings, updatedEntity);
    }
  } else
    updatedEntity = await settingsRepository.updateSettings(id, newSettings);

  const plainSettings = updatedEntity.get({ plain: true });
  plainSettings.password = '';
  plainSettings.secretKey = '';

  res.json(plainSettings);
}

module.exports = {
  getSettings,
  updateSettings
}