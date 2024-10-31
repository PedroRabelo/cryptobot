const usersRepository = require('../repositories/usersRepository');

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
  const user = await usersRepository.getUser(id);

  if (user.isActive) {
    //await stopUserMonitors(updatedUser);
    //await stopUserAutomations(user);
    //await sendStopAlerts(updatedUser);
  }

  await usersRepository.deleteUser(id);
  res.sendStatus(204);
}

module.exports = {
  getUsers,
  insertUser,
  updateUser,
  deleteUser,
  startUser,
  stopUser,
  resetUserPassword
}