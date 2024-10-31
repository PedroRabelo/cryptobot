const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const settingsRepository = require('../repositories/settingsRepository');
const usersRepository = require('../repositories/usersRepository');

async function doLogin(req, res, next) {
  const email = req.body.email;
  const password = req.body.password;
  const origin = req.headers.origin;

  let entity;

  if (origin === process.env.BEHOLDER_URL) {
    entity = await usersRepository.getUserByEmail(email);
  } else if (origin === process.env.HYDRA_URL) {
    entity = await settingsRepository.getSettingsByEmail(email);
  }

  if (entity) {
    const isValid = bcrypt.compareSync(password, entity.password);
    if (isValid) {
      const token = jwt.sign({
        id: entity.id,
        profile: origin === process.env.BEHOLDER_URL ? 'USER' : 'ADMIN'
      },
        process.env.JWT_SECRET, {
        expiresIn: parseInt(process.env.JWT_EXPIRES)
      })
      return res.json({ token });
    }
  }

  res.status(401).send('401 Unauthorized');
}

const blacklist = [];

function doLogout(req, res, next) {
  const token = req.headers['authorization'];
  blacklist.push(token);
  res.sendStatus(200);
}

function isBlacklisted(token) {
  return blacklist.some(t => token === t);
}

module.exports = {
  doLogin,
  doLogout,
  isBlacklisted
}