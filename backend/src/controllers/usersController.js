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

async function getUsers(req, res, next) {
  const page = req.query.page;
  const search = req.params.search;

  const result = await usersRepository.getUsers(search, page);
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

async function startUser(req, res, next) {
  const id = req.params.id;
  const user = await usersRepository.getUser(id);
  if (user.isActive) return res.sendStatus(204);

  user.isActive = true;
  await user.save();

  user.password = '';
  user.secretKey = '';
  res.json(user);
}

async function stopUser(req, res, next) {
  const id = req.params.id;
  const user = await usersRepository.getUser(id);
  if (!user.isActive) return res.sendStatus(204);

  user.isActive = false;
  await user.save();

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

  user.password = '';
  user.secretKey = '';
  res.json(user);
}

async function insertUser(req, res, next) {
  const newUser = req.body;
  const password = generatePassword();

  newUser.password = password;

  const user = await usersRepository.insertUser(newUser);

  if (user.isActive) {
    // enviar email
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
      //await startUserMonitors(updatedUser);
      //await sendStartAlerts(updatedUser);
    }
    else if (currentUser.isActive && !updatedUser.isActive) {
      //await stopUserMonitors(updatedUser);
      //await stopUserAutomations(user);
      //await sendStopAlerts(updatedUser);
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
    //await stopUserMonitors(updatedUser);
    //await stopUserAutomations(user);
    //await sendStopAlerts(updatedUser);
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