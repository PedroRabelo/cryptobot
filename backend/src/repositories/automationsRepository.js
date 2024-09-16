const automationModel = require('../models/automationModel');
const Sequelize = require('sequelize');

async function getActiveAutomations() {
  return automationModel.findAll({
    where: { isActive: true },
    distinct: true,
    include: [{ all: true, nested: true }]//já inclui todas tabelas relacionadas
  });
}

function getAutomation(id) {
  return automationModel.findByPk(id, { include: [{ all: true, nested: true }] });
}

function getAutomations(page = 1) {
  return automationModel.findAndCountAll({
    where: {},
    order: [['isActive', 'DESC'], ['symbol', 'ASC'], ['name', 'ASC']],
    limit: 10,
    offset: 10 * (page - 1),
    distinct: true,
    include: [{ all: true, nested: true }]//inclui todas tabelas relacionadas
  });
}

function insertAutomation(newAutomation, transaction) {
  return automationModel.create(newAutomation, { transaction });
}

function deleteAutomation(id, transaction) {
  return automationModel.destroy({
    where: { id },
    transaction
  })
}

async function updateAutomation(id, newAutomation) {
  const currentAutomation = await getAutomation(id);

  if (newAutomation.symbol && newAutomation.symbol !== currentAutomation.symbol)
    currentAutomation.symbol = newAutomation.symbol;

  if (newAutomation.name && newAutomation.name !== currentAutomation.name)
    currentAutomation.name = newAutomation.name;

  if (newAutomation.indexes && newAutomation.indexes !== currentAutomation.indexes)
    currentAutomation.indexes = newAutomation.indexes;

  if (newAutomation.conditions && newAutomation.conditions !== currentAutomation.conditions)
    currentAutomation.conditions = newAutomation.conditions;

  if (newAutomation.schedule !== currentAutomation.schedule)
    currentAutomation.schedule = newAutomation.schedule;

  if (newAutomation.isActive !== null && newAutomation.isActive !== undefined
    && newAutomation.isActive !== currentAutomation.isActive)
    currentAutomation.isActive = newAutomation.isActive;

  if (newAutomation.logs !== null && newAutomation.logs !== undefined
    && newAutomation.logs !== currentAutomation.logs)
    currentAutomation.logs = newAutomation.logs;

  await currentAutomation.save();
  return currentAutomation;
}

module.exports = {
  getActiveAutomations,
  getAutomation,
  getAutomations,
  insertAutomation,
  deleteAutomation,
  updateAutomation
}