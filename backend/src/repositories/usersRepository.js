const userModel = require('../models/userModel');
const AutomationModel = require('../models/automationModel');
const MonitorModel = require('../models/monitorModel');
const bcrypt = require('bcryptjs');
const crypto = require('../utils/crypto');
const Sequelize = require('sequelize');
const LimitModel = require('../models/limitModel');

async function getUserDecrypted(id, eagerLoading = false) {
  const user = await getUser(id, eagerLoading);
  if (!user) return user;

  if (user.secretKey)
    user.secretKey = crypto.decrypt(user.secretKey);

  return user;
}

function getUserByEmail(email) {
  return userModel.findOne({ where: { email } });
}

async function userExists(email) {
  const count = await userModel.count({ where: { email } });
  return count > 0;
}

async function insertUser(newUser) {
  const alreadyExists = await userExists(newUser.email);
  if (alreadyExists) throw new Error(`Already exists an user with this email.`);

  newUser.password = bcrypt.hashSync(newUser.password);
  return userModel.create(newUser);
}

function deleteUser(id, transaction) {
  return userModel.destroy({
    where: { id },
    transaction
  })
}

async function updateUser(id, newUser) {
  const currentUser = await getUser(id);

  if (newUser.name && newUser.name !== currentUser.name)
    currentUser.name = newUser.name;

  if (newUser.password)
    currentUser.password = bcrypt.hashSync(newUser.password);

  if (newUser.email && newUser.email !== currentUser.email)
    currentUser.email = newUser.email;

  if (newUser.phone !== null && newUser.phone !== currentUser.phone)
    currentUser.phone = newUser.phone;

  if (newUser.telegramChat !== null && newUser.telegramChat !== currentUser.telegramChat)
    currentUser.telegramChat = newUser.telegramChat;

  if (newUser.limitId && newUser.limitId !== currentUser.limitId)
    currentUser.limitId = newUser.limitId;

  if (newUser.accessKey !== null && newUser.accessKey !== undefined
    && newUser.accessKey !== currentUser.accessKey)
    currentUser.accessKey = newUser.accessKey;

  if (newUser.secretKey)
    currentUser.secretKey = crypto.encrypt(newUser.secretKey);

  if (newUser.isActive !== null && newUser.isActive !== undefined
    && newUser.isActive !== currentUser.isActive)
    currentUser.isActive = newUser.isActive;

  await currentUser.save();
  return currentUser;
}

function getUser(id, eagerLoading = false) {
  if (eagerLoading)
    return userModel.findByPk(id, {
      include: [AutomationModel, MonitorModel, LimitModel]
    })

  return userModel.findByPk(id);
}

function getUsers(search, page = 1, pageSize = 10) {
  const options = {
    where: {},
    order: [['isActive', 'DESC'], ['name', 'ASC'], ['email', 'ASC']],
    limit: pageSize,
    offset: pageSize * (page - 1),
    include: LimitModel
  }

  if (search) {
    if (search.indexOf('@') !== -1)
      options.where = { email: { [Sequelize.Op.like]: `%${search}%` } };
    else
      options.where = { name: { [Sequelize.Op.like]: `%${search}%` } };
  }

  return userModel.findAndCountAll(options);
}

async function getActiveLaunchUsers() {
  return userModel.findAll({
    where: { isActive: true },
  })
}

async function getActiveUsers() {
  const users = await userModel.findAll({
    where: { isActive: true },
    include: [MonitorModel, AutomationModel]
  });

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (user.secretKey)
      user.secretKey = crypto.decrypt(user.secretKey);
  }

  return users;
}

function getActiveUsersQty() {
  return userModel.count({
    where: { isActive: true }
  })
}

module.exports = {
  getActiveUsers,
  insertUser,
  deleteUser,
  getUsers,
  getUser,
  updateUser,
  getUserDecrypted,
  getUserByEmail,
  getActiveUsersQty,
  getActiveLaunchUsers
}