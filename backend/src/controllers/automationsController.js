const automationsRepository = require('../repositories/automationsRepository');
const actionsRepository = require('../repositories/actionsRepository');
const gridsRepository = require('../repositories/gridsRepository');
const orderTemplatesRepository = require('../repositories/orderTemplatesRepository');
const ordersRepository = require('../repositories/ordersRepository');
const usersRepository = require('../repositories/usersRepository');
const hydra = require('../hydra');
const agenda = require('../agenda');
const db = require('../db');
const logger = require('../utils/logger');

function validateConditions(conditions) {
  return /^(MEMORY\[\'.+?\'\](\..+)?[><=!]+([0-9\.\-]+|(\'.+?\')|true|false|MEMORY\[\'.+?\'\](\..+)?)( && )?)+$/ig.test(conditions);
}

async function startAutomation(req, res, next) {
  const userId = res.locals.token.id;
  const id = req.params.id;

  const automation = await automationsRepository.getAutomation(id);
  if (automation.userId !== userId) return res.sendStatus(403);
  if (automation.isActive) return res.sendStatus(204);

  automation.isActive = true;

  if (automation.schedule) {
    try {
      agenda.addSchedule(automation.get({ plain: true }));
    } catch (err) {
      return res.status(422).json(err.message);
    }
  }
  else
    hydra.updateBrain(automation.get({ plain: true }));

  await automation.save();

  if (automation.logs) logger('A:' + automation.id, `Automation ${automation.name} has started!`);

  res.json(automation);
}

async function stopAutomation(req, res, next) {
  const userId = res.locals.token.id;
  const id = req.params.id;
  const automation = await automationsRepository.getAutomation(id);
  if (automation.userId !== userId) return res.sendStatus(403);
  if (!automation.isActive) return res.sendStatus(204);

  automation.isActive = false;

  if (automation.schedule)
    agenda.cancelSchedule(automation.id);
  else
    hydra.deleteBrain(automation.get({ plain: true }));

  hydra.deleteBrain(automation.get({ plain: true }));
  await automation.save();

  if (automation.logs) logger('A:' + automation.id, `Automation ${automation.name} has stopped!`);

  res.json(automation);
}

async function getAutomation(req, res, next) {
  const userId = res.locals.token.id;
  const id = req.params.id;
  const automation = await automationsRepository.getAutomation(id);
  if (automation.userId !== userId) return res.sendStatus(403);
  res.json(automation);
}

async function getAutomations(req, res, next) {
  const userId = res.locals.token.id;
  const page = req.query.page;
  const result = await automationsRepository.getAutomations(userId, page);
  res.json(result);
}

async function insertAutomation(req, res, next) {
  const userId = res.locals.token.id;

  const newAutomation = req.body;
  newAutomation.userId = userId;

  const { quantity, levels } = req.query;

  if (!validateConditions(newAutomation.conditions) && !newAutomation.schedule)
    return res.status(400).json(`Invalid conditions!`);

  if (!newAutomation.actions || newAutomation.actions.length === 0)
    return res.status(400).json(`Invalid actions!`);

  const isGrid = newAutomation.actions[0].type === actionsRepository.actionsTypes.GRID;
  if (isGrid && (!quantity || !levels)) {
    return res.status(400).json(`Invalid grid params.`);
  }

  const user = await usersRepository.getUser(userId, true);
  if (user.automations.length >= user.limit.maxAutomations)
    return res.status(409).send(`You have reached the max automations in you plan.`);

  const alreadyExists = await automationsRepository.automationExists(userId, newAutomation.name);
  if (alreadyExists)
    return res.status(409).json(`Already exists an automation with this name`);

  const transaction = await db.transaction();
  let savedAutomation, actions = [], grids = [];

  try {
    savedAutomation = await automationsRepository.insertAutomation(newAutomation, transaction);

    actions = newAutomation.actions.map(a => {
      a.automationId = savedAutomation.id;
      delete a.id;
      return a;
    });

    actions = await actionsRepository.insertActions(actions, transaction);

    if (isGrid)
      grids = await hydra.generateGrids(savedAutomation, levels, quantity, transaction);

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    logger('system', err);
    return res.status(500).json(err.message);
  }

  savedAutomation = await automationsRepository.getAutomation(savedAutomation.id);

  if (savedAutomation.isActive) {
    if (savedAutomation.schedule) {
      agenda.addSchedule(savedAutomation.get({ plain: true }));
    } else {
      hydra.updateBrain(savedAutomation.get({ plain: true }));
    }
  }

  res.status(201).json(savedAutomation);
}

async function updateAutomation(req, res, next) {
  const userId = res.locals.token.id;
  const id = req.params.id;
  const newAutomation = req.body;
  newAutomation.userId = userId;

  const { quantity, levels } = req.query;

  if (!validateConditions(newAutomation.conditions) && !newAutomation.schedule)
    return res.status(400).json(`Invalid conditions!`);

  if (!newAutomation.actions || !newAutomation.actions.length)
    return res.status(400).json('Invalid actions');

  const isGrid = newAutomation.actions[0].type === actionsRepository.actionsTypes.GRID;
  if (isGrid && (!quantity || levels))
    return res.status(400).json(`Invalid grid params`);

  const actions = newAutomation.actions.map(a => {
    a.automationId = id;
    delete a.id;
    return a;
  });

  const transaction = await db.transaction();
  const currentAutomation = await automationsRepository.getAutomation(id);
  if (!currentAutomation) return res.sendStatus(404);
  if (currentAutomation.userId !== userId) return res.sendStatus(403);
  let updatedAutomation;

  try {
    updatedAutomation = await automationsRepository.updateAutomation(id, newAutomation);

    if (isGrid) {
      await hydra.generateGrids(updatedAutomation, levels, quantity, transaction);
    } else {
      await actionsRepository.deleteActions(id, transaction);
      actions = await actionsRepository.insertActions(actions, transaction);
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    logger('system', err);
    return res.status(500).json(err.message);
  }

  updatedAutomation = await automationsRepository.getAutomation(id);

  if (updatedAutomation.isActive) {
    if (updatedAutomation.schedule) {
      agenda.cancelSchedule(updatedAutomation.id);
      agenda.addSchedule(updatedAutomation.get({ plain: true }));
    } else {
      hydra.deleteBrain(currentAutomation);
      hydra.updateBrain(updatedAutomation.get({ plain: true }));
    }
  } else {
    if (updatedAutomation.schedule) {
      agenda.cancelSchedule(updatedAutomation.id);
    } else {
      hydra.deleteBrain(currentAutomation);
    }
  }

  res.json(updatedAutomation);
}

async function deleteAutomation(req, res, next) {
  const userId = res.locals.token.id;
  const id = req.params.id;
  const currentAutomation = await automationsRepository.getAutomation(id);
  if (currentAutomation.userId !== userId) return res.sendStatus(403);

  if (currentAutomation.isActive) {
    if (currentAutomation.schedule)
      agenda.cancelSchedule(currentAutomation.id);
    else
      hydra.deleteBrain(currentAutomation);
  }

  const transaction = db.transaction();

  try {

    await ordersRepository.removeAutomationFromOrders(id, transaction);

    if (currentAutomation.actions[0].type === actionsRepository.actionsTypes.GRID) {
      await gridsRepository.deleteGrids(id, transaction);
      await orderTemplatesRepository.deleteOrderTemplatesByGridName(userId, currentAutomation.name, transaction);
    }

    await actionsRepository.deleteActions(id, transaction);
    await automationsRepository.deleteAutomation(id, transaction);
    await transaction.commit();
    res.sendStatus(204);
  } catch (err) {
    await transaction.rollback();
    logger('system', err);
    return res.status(500).json(err.message);
  }
}

module.exports = {
  startAutomation,
  stopAutomation,
  getAutomation,
  getAutomations,
  insertAutomation,
  updateAutomation,
  deleteAutomation
} 