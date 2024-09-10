const MEMORY = {}

let BRAIN = {}

const LOGS = process.env.BEHOLDER_LOGS === 'true';

function init(automations) {

}

function updateMemory(symbol, index, interval, value) {
  const indexKey = interval ? `${index}_${interval}` : index;
  const memoryKey = `${symbol}:${indexKey}`;
  MEMORY[memoryKey] = value;

  if (LOGS) console.log(`Beholder memory updated: ${memoryKey} => ${JSON.stringify(value)}`);
}

function getMemory() {
  return { ...MEMORY };
}

function getBrain() {
  return { ...BRAIN };
}

module.exports = {
  updateMemory,
  getMemory,
  getBrain,
  init
}