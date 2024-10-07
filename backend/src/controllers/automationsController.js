const automationsRepository = require('../repositories/automationsRepository');
const actionsRepository = require('../repositories/actionsRepository');
const gridsRepository = require('../repositories/gridsRepository');
const orderTemplatesRepository = require('../repositories/orderTemplatesRepository');
const symbolsRepository = require('../repositories/symbolsRepository');
const beholder = require('../beholder');
const db = require('../db');

function validateConditions(conditions) {
  return /^(MEMORY\[\'.+?\'\](\..+)?[><=!]+([0-9\.\-]+|(\'.+?\')|true|false|MEMORY\[\'.+?\'\](\..+)?)( && )?)+$/ig.test(conditions);
}

async function startAutomation(req, res, next) {
  const id = req.params.id;
  const automation = await automationsRepository.getAutomation(id);
  if (automation.isActive) return res.sendStatus(204);

  automation.isActive = true;
  beholder.updateBrain(automation.get({ plain: true }));

  // if (automation.schedule) {
  //     try {
  //         agenda.addSchedule(automation.get({ plain: true }));
  //     } catch (err) {
  //         return res.status(422).json(err.message);
  //     }
  // }
  // else
  //     beholder.updateBrain(automation.get({ plain: true }));

  await automation.save();

  if (automation.logs) logger('A:' + automation.id, `Automation ${automation.name} has started!`);

  res.json(automation);
}

async function stopAutomation(req, res, next) {
  const id = req.params.id;
  const automation = await automationsRepository.getAutomation(id);
  if (!automation.isActive) return res.sendStatus(204);

  // if (automation.schedule)
  //     agenda.cancelSchedule(automation.id);
  // else
  //     beholder.deleteBrain(automation.get({ plain: true }));

  automation.isActive = false;
  beholder.deleteBrain(automation.get({ plain: true }));
  await automation.save();

  if (automation.logs) logger('A:' + automation.id, `Automation ${automation.name} has stopped!`);

  res.json(automation);
}

async function getAutomation(req, res, next) {
  const id = req.params.id;
  const automation = await automationsRepository.getAutomation(id);
  res.json(automation);
}

async function getAutomations(req, res, next) {
  const page = req.query.page;
  const result = await automationsRepository.getAutomations(page);
  res.json(result);
}

async function insertAutomation(req, res, next) {
  const newAutomation = req.body;
  const { quantity, levels } = req.query;

  if (!validateConditions(newAutomation.conditions))
    return res.status(400).json(`Invalid conditions!`);

  if (!newAutomation.actions || !newAutomation.actions.length)
    return res.status(400).json(`Invalid actions!`);

  const isGrid = newAutomation.actions[0].type === actionsRepository.actionsTypes.GRID;
  if (isGrid && (!quantity || !levels)) {
    return res.status(400).json(`Invalid grid params.`);
  }

  const alreadyExists = await automationsRepository.automationExists(newAutomation.name);
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
      grids = await beholder.generateGrids(savedAutomation, levels, quantity, transaction);

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    return res.status(500).json(err.message);
  }

  savedAutomation.actions = actions;

  if (isGrid)
    savedAutomation.grids = grids;

  if (savedAutomation.isActive) {
    beholder.updateBrain(savedAutomation);
  }

  res.status(201).json(savedAutomation);
}

async function updateAutomation(req, res, next) {
  const id = req.params.id;
  const newAutomation = req.body;

  const { quantity, levels } = req.query;

  if (!validateConditions(newAutomation.conditions))
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
  let grids = [], updatedAutomation;

  try {
    updatedAutomation = await automationsRepository.updateAutomation(id, newAutomation);

    if (isGrid) {
      await beholder.generateGrids(updatedAutomation, levels, quantity, transaction);
    } else {
      await actionsRepository.deleteActions(id, transaction);
      actions = await actionsRepository.insertActions(actions, transaction);
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    return res.status(500).json(err.message);
  }

  updatedAutomation = await automationsRepository.getAutomation(id);

  if (updatedAutomation.isActive) {
    beholder.deleteBrain(updatedAutomation);
    beholder.updateBrain(updatedAutomation);
  } else {
    beholder.deleteBrain(updatedAutomation);
  }

  res.json(updatedAutomation);
}

async function deleteAutomation(req, res, next) {
  const id = req.params.id;
  const currentAutomation = await automationsRepository.getAutomation(id);
  if (currentMonitor.isSystemMon) return res.sendStatus(403);

  if (currentMonitor.isActive) {
    beholder.deleteBrain(currentMonitor.get({ plain: true }));
  }

  const transaction = db.transaction();

  try {

    if (currentAutomation.actions[0].type === actionsRepository.actionsTypes.GRID) {
      await gridsRepository.deleteGrids(id, transaction);
      await orderTemplatesRepository.deleteOrderTemplatesByGridName(currentAutomation.name, transaction);
    }

    await actionsRepository.deleteActions(id, transaction);
    await automationsRepository.deleteAutomation(id, transaction);
    await transaction.commit();
    res.sendStatus(204);
  } catch (err) {
    await transaction.rollback();
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