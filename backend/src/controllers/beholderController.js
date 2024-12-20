const { getActiveUserMonitors } = require('../repositories/monitorsRepository');
const { getActiveUsers } = require('../repositories/usersRepository');
const hydra = require('../hydra');
const indexes = require('../utils/indexes');
const agenda = require('../agenda');

const USER_VARIABLES = [indexes.indexKeys.WALLET, indexes.indexKeys.LAST_ORDER]

function getMemory(req, res, next) {
  let { symbol, index, interval } = req.params;
  if (USER_VARIABLES.includes(index))
    index = `${index}_${res.locals.token.id}`;

  res.json(hydra.getMemory(symbol, index, interval));
}

async function getMemoryIndexes(req, res, next) {
  const userId = res.locals.token.id;
  const monitors = await getActiveUserMonitors(userId);
  const userIndexes = monitors.map(m => m.indexes.split(',')).flat();
  userIndexes.push(indexes.indexKeys.LAST_CANDLE, indexes.indexKeys.BOOK, indexes.indexKeys.MINI_TICKER, `${indexes.indexKeys.WALLET}_${userId}`, `${indexes.indexKeys.LAST_ORDER}_${userId}`)

  let memory = hydra.getMemoryIndexes();
  memory = userIndexes.map(uix => memory.filter(m => new RegExp(`^(${uix}(\.|$))`).test(m.variable))).flat();
  res.json(memory);
}

function getBrain(req, res, next) {
  res.json(hydra.getBrain());
}

function getBrainIndexes(req, res, next) {
  res.json(hydra.getBrainIndexes());
}

function getAnalysisIndexes(req, res, next) {
  res.json(indexes.getAnalysisIndexes());
}

function getAgenda(req, res, next) {
  res.json(agenda.getAgenda());
}

async function getStreams(req, res, next) {
  const appEm = require('../app-em');
  res.json(appEm.getConnections());
}

async function init(req, res, next) {
  const users = await getActiveUsers();
  hydra.init(users);
  res.json(hydra.getBrain());
}

module.exports = {
  getMemory,
  getMemoryIndexes,
  getBrain,
  getBrainIndexes,
  getAnalysisIndexes,
  getAgenda,
  getStreams,
  init
}