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

async function generateGrids(automation, levels, quantity, transaction) {
  await gridsRepository.deleteGrids(automation.id, transaction);
  await orderTemplatesRepository.deleteOrderTemplatesByGridName(automation.name, transaction);

  const symbol = await symbolsRepository.getSymbol(automation.symbol);
  const tickSize = parseFloat(symbol.tickSize);

  const conditionSplit = automation.conditions.split(' && ');
  const lowerLimit = parseFloat(conditionSplit[0].split('>')[1]);
  const upperLimit = parseFloat(conditionSplit[1].split('<')[1]);
  levels = parseInt(levels);

  const priceLevel = (upperLimit - lowerLimit) / levels;
  const grids = [];

  const buyOrderTemplate = await orderTemplatesRepository.insertOrderTemplate({
    name: automation.name + 'BUY',
    symbol: automation.symbol,
    type: 'MARKET',
    side: 'BUY',
    limitPrice: null,
    limitPriceMultiplier: 1,
    quantity,
    quantityMultiplier: 1,
    icebergQty: null,
    icebergQtyMultiplier: 1
  }, transaction)

  const sellOrderTemplate = await orderTemplatesRepository.insertOrderTemplate({
    name: automation.name + 'SELL',
    symbol: automation.symbol,
    type: 'MARKET',
    side: 'SELL',
    limitPrice: null,
    limitPriceMultiplier: 1,
    quantity,
    quantityMultiplier: 1,
    icebergQty: null,
    icebergQtyMultiplier: 1
  }, transaction)

  const currentPrice = parseFloat(await beholder.getMemory(automation.symbol, 'BOOK', null).current.bestAsk);
  const differences = [];

  for (let i = 1; i <= levels; i++) {
    const priceFactor = Math.floor((lowerLimit + (priceLevel * i)) / tickSize);
    const targetPrice = priceFactor * tickSize;
    const targetPriceStr = targetPrice.toFixed(symbol.quotePrecision);
    differences.push(Math.abs(currentPrice - targetPrice));

    if (targetPrice < currentPrice) { //se está abaixo da cotação, compra
      const previousLevel = targetPrice - priceLevel;
      const previousLevelStr = previousLevel.toFixed(symbol.quotePrecision);
      grids.push({
        automationId: automation.id,
        conditions: `MEMORY['${automation.symbol}:BOOK'].current.bestAsk<${targetPriceStr} && MEMORY['${automation.symbol}:BOOK'].previous.bestAsk>=${targetPriceStr} && MEMORY['${automation.symbol}:BOOK'].current.bestAsk>${previousLevelStr}`,
        orderTemplateId: buyOrderTemplate.id
      })
    } else { //se está acima da cotação, vende
      const nextLevel = targetPrice + priceLevel;
      const nextLevelStr = nextLevel.toFixed(symbol.quotePrecision);
      grids.push({
        automationId: automation.id,
        conditions: `MEMORY['${automation.symbol}:BOOK'].current.bestBid>${targetPriceStr} && MEMORY['${automation.symbol}:BOOK'].previous.bestBid<=${targetPriceStr} && MEMORY['${automation.symbol}:BOOK'].current.bestBid<${nextLevelStr}`,
        orderTemplateId: sellOrderTemplate.id
      })
    }
  }

  const nearestGrid = differences.findIndex(d => d === Math.min(...differences));
  grids.splice(nearestGrid, 1);

  return gridsRepository.insertGrids(grids, transaction);
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
      grids = await generateGrids(savedAutomation, levels, quantity, transaction);

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    return res.status(500).json(err.message);
  }

  savedAutomation = savedAutomation.get({ plain: true });
  savedAutomation.actions = actions.map(a => a.get({ plain: true }));

  if (isGrid)
    savedAutomation.grids = grids.map(g => g.get({ plain: true }));

  if (savedAutomation.isActive) {
    beholder.updateBrain(savedAutomation);
  }

  res.status(201).json(savedAutomation);
}

async function updateAutomation(req, res, next) {
  const id = req.params.id;
  const newAutomation = req.body;

  if (!validateConditions(newAutomation.conditions))
    return res.status(400).json(`Invalid conditions!`);

  if (newAutomation.actions && newAutomation.actions.length > 0) {
    const actions = newAutomation.actions.map(a => {
      a.automationId = id;
      delete a.id;
      return a;
    });

    const transaction = await db.transaction();

    try {
      await actionsRepository.deleteActions(id, transaction);
      await actionsRepository.insertActions(actions, transaction);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      return res.status(500).json(err.message);
    }
  }

  const updatedAutomation = await automationsRepository.updateAutomation(id, newAutomation);

  const plainAutomation = updatedAutomation.get({ plain: true })
  if (updatedAutomation.isActive) {
    beholder.deleteBrain(plainAutomation);
    beholder.updateBrain(plainAutomation);
  } else {
    beholder.deleteBrain(plainAutomation);
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