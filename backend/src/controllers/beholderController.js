const { getAutomations } = require('../repositories/automationRepository');
const { getActiveUserMonitors } = require('../repositories/monitorsRepository');
const beholder = require('../beholder');
const indexes = require('../utils/indexes');
const agenda = require('../agenda');

const USER_VARIABLES = [indexes.indexKeys.WALLET, indexes.indexKeys.LAST_ORDER]

function getMemory(req, res, next) {
  let { symbol, index, interval } = req.params;
  if (USER_VARIABLES.includes(index))
    index = `${index}_${res.locals.token.id}`;

  res.json(beholder.getMemory(symbol, index, interval));
}

async function getMemoryIndexes(req, res, next) {
  const userId = res.locals.token.id;
  const monitors = await getActiveUserMonitors(userId);
  const userIndexes = monitors.map(m => m.indexes.split(',')).flat();
  userIndexes.push(indexes.indexKeys.LAST_CANDLE, indexes.indexKeys.BOOK, indexes.indexKeys.MINI_TICKER, `${indexes.indexKeys.WALLET}_${userId}`, `${indexes.indexKeys.LAST_ORDER}_${userId}`)

  let memory = beholder.getMemoryIndexes();
  memory = userIndexes.map(uix => memory.filter(m => new RegExp(`^(${uix}(\.|$))`).test(m.variable))).flat();
  res.json(memory);
}

function getBrain(req, res, next) {
  res.json(beholder.getBrain());
}

function getBrainIndexes(req, res, next) {
  res.json(beholder.getBrainIndexes());
}

function getAnalysisIndexes(req, res, next) {
  res.json(indexes.getAnalysisIndexes());
}

function getAgenda(req, res, next) {
  res.json(agenda.getAgenda());
}

async function init(req, res, next) {
  const automations = await getAutomations();
  beholder.init(automations);
  res.json(beholder.getBrain());
}

module.exports = {
  getMemory,
  getMemoryIndexes,
  getBrain,
  getBrainIndexes,
  getAnalysisIndexes,
  getAgenda,
  init
}