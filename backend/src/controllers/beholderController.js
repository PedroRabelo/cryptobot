const beholder = require('../beholder');
const indexes = require('../utils/indexes');
const agenda = require('../agenda');

function getMemory(req, res, next) {
  const { symbol, index, interval } = req.params;

  res.json(beholder.getMemory(symbol, index, interval));
}

function getMemoryIndexes(req, res, next) {
  res.json(beholder.getMemoryIndexes())
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

module.exports = {
  getMemory,
  getMemoryIndexes,
  getBrain,
  getBrainIndexes,
  getAnalysisIndexes,
  getAgenda
}