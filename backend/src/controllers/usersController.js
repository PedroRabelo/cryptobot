const settingsRepository = require('../repositories/settingsRepository');
const usersRepository = require('../repositories/usersRepository');
const automationsRepository = require('../repositories/automationsRepository');
const monitorsRepository = require('../repositories/monitorsRepository');
const ordersRepository = require('../repositories/ordersRepository');
const orderTemplatesRepository = require('../repositories/orderTemplatesRepository');
const withdrawTemplatesRepository = require('../repositories/withdrawTemplatesRepository');
const actionsRepository = require('../repositories/actionsRepository');
const favoriteSymbolsRepository = require('../repositories/favoriteSymbolsRepository');
const gridsRepository = require('../repositories/gridsRepository');
const db = require('../db');
const appEm = require('../app-em');
const logger = require('../utils/logger');
const email = require('../utils/email');
const sms = require('../utils/sms');
const telegram = require('../utils/telegram');
const crypto = require('../utils/crypto');
const agenda = require('../agenda')

async function getUsers(req, res, next) {
  const page = req.query.page;
  const pageSize = req.query.pageSize;
  const search = req.params.search;

  const result = await usersRepository.getUsers(search, page, pageSize);
  result.rows = result.rows.map(r => {
    const plainUser = r.get({ plain: true });
    plainUser.password = '';
    plainUser.secretKey = '';
    return plainUser;
  })

  res.json(result);
}

function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

async function startUserMonitors(user) {
  const settings = await settingsRepository.getDefaultSettings();
  const systemMonitors = await monitorsRepository.getActiveSystemMonitors();
  const userDataMonitor = systemMonitors.find(m => m.type === monitorsRepository.monitorTypes.USER_DATA);

  if (!user.monitors) user.monitors = [];
  if (userDataMonitor && user.accessKey && user.secretKey) user.monitors.push(userDataMonitor);

  await Promise.all(user.monitors.map(m => {
    setTimeout(() => {
      switch (m.type) {
        case monitorsRepository.monitorTypes.USER_DATA: {
          const decryptedUser = { ...(user.get({ plain: true })), secretKey: crypto.decrypt(user.secretKey) };
          return appEm.startUserDataMonitor(settings, decryptedUser, m.id, m.broadcastLabel, m.logs);
        }
        case monitorsRepository.monitorTypes.CANDLES:
          return appEm.startChartMonitor(user.id, m.id, m.symbol, m.interval, m.indexes, m.broadcastLabel, m.logs);
        case monitorsRepository.monitorTypes.TICKER:
          return appEm.startTickerMonitor(user.id, m.id, m.symbol, m.broadcastLabel, m.logs);
      }
    }, 250)
  }))
}

async function stopUserMonitors(user) {
  const systemMonitors = await monitorsRepository.getActiveSystemMonitors();
  const userDataMonitor = systemMonitors.find(m => m.type === monitorsRepository.monitorTypes.USER_DATA);

  if (!user.monitors) user.monitors = [];
  if (userDataMonitor) user.monitors.push(userDataMonitor);

  await Promise.all(user.monitors.map(async monitor => {
    setTimeout(() => {
      switch (monitor.type) {
        case monitorsRepository.monitorTypes.USER_DATA: {
          const decryptedUser = { ...(user.get({ plain: true })), secretKey: crypto.decrypt(user.secretKey) };
          return appEm.stopUserDataMonitor(decryptedUser, monitor.id, monitor.logs);
        }
        case monitorsRepository.monitorTypes.CANDLES:
          return appEm.stopChartMonitor(monitor.id, monitor.symbol, monitor.interval, monitor.indexes, monitor.logs);
        case monitorsRepository.monitorTypes.TICKER:
          return appEm.stopTickerMonitor(monitor.id, monitor.symbol, monitor.logs);
      }
    }, 250)

    if (monitor.type !== monitorsRepository.monitorTypes.USER_DATA)
      await monitorsRepository.updateMonitor(monitor.id, { isActive: false });
  }))
}

async function stopUserAutomations(user) {
  await Promise.all(user.automations.map(async (automation) => {
    if (!automation.isActive) return;

    if (automation.schedule)
      agenda.cancelSchedule(automation.id);
    else
      beholder.deleteBrain(automation.get({ plain: true }));

    await automationsRepository.updateAutomation(automation.id, { isActive: false });

    if (automation.logs) logger(`A:${automation.id}`, `Automation ${automation.name} has stopped!`);
  }))
}

async function startUser(req, res, next) {
  const id = req.params.id;
  const user = await usersRepository.getUser(id, true);
  if (user.isActive) return res.sendStatus(204);

  user.isActive = true;
  await user.save();

  await startUserMonitors(user);
  await sendStartAlerts(user);

  user.password = '';
  user.secretKey = '';
  res.json(user);
}

async function stopUser(req, res, next) {
  const id = req.params.id;
  const user = await usersRepository.getUser(id, true);
  if (!user.isActive) return res.sendStatus(204);

  user.isActive = false;
  await user.save();

  await sendStopAlerts(user);
  await stopUserMonitors(user);
  await stopUserAutomations(user);

  user.password = '';
  user.secretKey = '';
  res.json(user);
}

async function resetUserPassword(req, res, next) {
  const id = req.params.id;
  const password = generatePassword();

  const user = await usersRepository.updateUser(id, {
    password
  })

  await sendResetAlerts(user, password);

  user.password = '';
  user.secretKey = '';
  res.json(user);
}

async function sendWelcomAlerts(user, newPassword) {
  const promises = [];
  const settings = await settingsRepository.getDefaultSettings();

  if (settings.sendGridKey)
    promises.push(email(settings,
      `Hello ${user.name.split(' ')[0]},
       
       Your account at Beholder was created.

       Access the platform and use this email and your password ${newPassword}

       ${process.env.BEHOLDER_URL}

       After the first login, go to Settings area and change for new one.

       Start a conversation with our Telegram Bot, in order ot receive alerts there too:

       https://t.me/${settings.telegramBot}

       Enjoy!
      `,
      user.email,
      'Beholder account created'
    ));

  if (user.phone && settings.twilioSid)
    promises.push(sms(settings, `Your account at Beholder was created. Look your email!`, user.phone));

  await Promise.all(promises);
}

async function sendResetAlerts(user, newPassword) {
  const promises = [];
  const settings = await settingsRepository.getDefaultSettings();

  if (settings.sendGridKey)
    promises.push(email(settings,
      `Hello ${user.name.split(' ')[0]},
       
       Your password at Beholder was resetted.

       Access the platform and use this email and the new password: ${newPassword}

       ${process.env.BEHOLDER_URL}

       Enjoy!
      `,
      user.email,
      'Beholder password resetted!'
    ));

  if (user.phone && settings.twilioSid)
    promises.push(sms(settings, `Your password at Beholder was resetted. Look your email!`, user.phone));

  if (user.telegramChat && settings.telegramBot)
    promises.push(telegram(settings,
      `Hello ${user.name.split(' ')[0]},
       
       Your password at Beholder was resetted.

       Access the platform and use this email and the new password: ${newPassword}

       ${process.env.BEHOLDER_URL}

       Enjoy!
      `,
      user.telegramChat
    ));

  await Promise.all(promises);
}

async function sendStopAlerts(user) {
  const promises = [];
  const settings = await settingsRepository.getDefaultSettings();

  if (settings.sendGridKey)
    promises.push(email(settings,
      `Hello ${user.name.split(' ')[0]},
       
       Your account at Beholder was stopped.

       Sorry!
      `,
      user.email,
      'Beholder account stopped!'
    ));

  if (user.phone && settings.twilioSid)
    promises.push(sms(settings, `Your password at Beholder was stopped.`, user.phone));

  if (user.telegramChat && settings.telegramBot)
    promises.push(telegram(settings,
      `Hello ${user.name.split(' ')[0]},
       
       Your account at Beholder was stopped.

       Sorry!
      `,
      user.telegramChat
    ));

  await Promise.all(promises);
}

async function sendStartAlerts(user) {
  const promises = [];
  const settings = await settingsRepository.getDefaultSettings();

  if (settings.sendGridKey)
    promises.push(email(settings,
      `Hello ${user.name.split(' ')[0]},
       
       Your account at Beholder was (re)started.

       Enjoy!
      `,
      user.email,
      'Beholder account stopped!'
    ));

  if (user.phone && settings.twilioSid)
    promises.push(sms(settings, `Your password at Beholder was started.`, user.phone));

  if (user.telegramChat && settings.telegramBot)
    promises.push(telegram(settings,
      `Hello ${user.name.split(' ')[0]},
       
       Your account at Beholder was (re)started.

       Enjoy!
      `,
      user.telegramChat
    ));

  await Promise.all(promises);
}

async function insertUser(req, res, next) {
  const newUser = req.body;
  const password = generatePassword();

  newUser.password = password;

  const user = await usersRepository.insertUser(newUser);

  if (user.isActive) {
    await sendWelcomAlerts(user, password);
  }

  const plainUser = user.get({ plain: true });
  plainUser.password = '';
  res.status(201).json(plainUser);
}

async function updateUser(req, res, next) {
  const userId = req.params.id;
  const newUser = req.body;
  const token = res.locals.token;

  if (token.profile !== 'ADMIN' && token.id !== userId)
    return res.sendStatus(403);

  const currentUser = await usersRepository.getUser(userId);
  const updatedUser = await usersRepository.updateUser(userId, newUser);

  try {
    if (!currentUser.isActive && updatedUser.isActive) {
      await startUserMonitors(updatedUser);
      await sendStartAlerts(updatedUser);
    }
    else if (currentUser.isActive && !updatedUser.isActive) {
      await stopUserMonitors(updatedUser);
      await stopUserAutomations(user);
      await sendStopAlerts(updatedUser);
    }

    res.json(updatedUser);
  } catch (err) {
    logger(`system`, err);
    return res.status(500).send(err.message);
  }
}

async function deleteUser(req, res, next) {
  const id = req.params.id;
  const user = await usersRepository.getUser(id, true);

  if (user.isActive) {
    await stopUserMonitors(updatedUser);
    await stopUserAutomations(user);
    await sendStopAlerts(user);
  }

  const transaction = await db.transaction();

  try {
    await favoriteSymbolsRepository.deleteAll(id, transaction);
    await ordersRepository.deleteAll(id, transaction);
    await orderTemplatesRepository.deleteAll(id, transaction);
    await withdrawTemplatesRepository.deleteAll(id, transaction);
    await monitorsRepository.deleteAll(id, transaction);

    const automationsId = user.automations.map(a => a.id);
    await actionsRepository.deleteActions(automationsId, transaction);
    await gridsRepository.deleteGrids(automationsId, transaction);
    await automationsRepository.deleteAll(id, transaction);

    await usersRepository.deleteUser(id, transaction);

    await transaction.commit();
    res.sendStatus(204);
  } catch (error) {
    await transaction.rollback();
    logger('system', err);
    return res.status(500).json(`There was an error to delete the user.`);
  }
}

async function getActiveUsers(req, res, next) {
  let users = await usersRepository.getActiveUsers();
  users = users.map(u => {
    const plainUser = u.get({ plain: true });
    plainUser.secretKey = '';
    plainUser.password = '';
    return plainUser;
  })

  res.json(users);
}

module.exports = {
  getUsers,
  insertUser,
  updateUser,
  deleteUser,
  startUser,
  stopUser,
  resetUserPassword,
  getActiveUsers
}