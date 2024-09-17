const { getDefaultSettings } = require('./repositories/settingsRepository');

const MEMORY = {}

let BRAIN = {}
let BRAIN_INDEX = {}

let LOCK_MEMORY = false;

let LOCK_BRAIN = false;

const LOGS = process.env.BEHOLDER_LOGS === 'true';

function init(automations) {
  try {
    LOCK_BRAIN = true;
    LOCK_MEMORY = true;

    BRAIN = {};
    BRAIN_INDEX = {};

    automations.map(auto => updateBrain(auto));
  } finally {
    LOCK_BRAIN = false;
    LOCK_MEMORY = false;
    console.log('Beholder Brain has started!');
  }
}

function updateBrain(automation) {
  if (!automation.isActive || !automation.conditions) return;

  BRAIN[automation.id] = automation;
  automation.index.split(',').map(ix => updateBrainIndex(ix, automation.id));
}

function updateBrainIndex(index, automationId) {
  if (!BRAIN_INDEX[index]) BRAIN_INDEX[index] = [];
  BRAIN_INDEX[index].push(automationId);
}

function updateMemory(symbol, index, interval, value, executeAutomations = true) {

  if (LOCK_MEMORY) return false;

  const indexKey = interval ? `${index}_${interval}` : index;
  const memoryKey = `${symbol}:${indexKey}`;
  MEMORY[memoryKey] = value;

  if (LOGS) console.log(`Beholder memory updated: ${memoryKey} => ${JSON.stringify(value)}`);

  if (!LOCK_BRAIN) return false;

  try {
    const automations = findAutomations(memoryKey)
    if (automations && automations.length > 0 && !LOCK_BRAIN) {
      LOCK_BRAIN = true;
      let results = automations.map(auto => {
        return evalDecision(auto);
      }).flat();

      results = results.filter(r => r);

      if (!results || !results.length)
        return false;
      else
        return results;
    }
  } finally {
    LOCK_BRAIN = false;
  }
}

function invertConditions(conditions) {
  const conds = conditions.split(' && ');
  return conds.map(c => {
    if (c.indexOf('current') !== -1) {
      if (c.indexOf('>') !== -1) return c.replace('>', '<').replace('current', 'previous');
      if (c.indexOf('<') !== -1) return c.replace('<', '>').replace('current', 'previous');
      if (c.indexOf('!') !== -1) return c.replace('!', '').replace('current', 'previous');
      if (c.indexOf('==') !== -1) return c.replace('==', '!==').replace('current', 'previous');
    }
  })
    .filter(c => c)
    .join(' && ');
}

async function evalDecision(automation) {
  const indexes = automation.indexes.split(',');
  const isChecked = indexes.every(ix => MEMORY[ix] !== null && MEMORY[ix] !== undefined);

  if (!isChecked) return false;

  const invertedConditions = invertConditions(automation.conditions);
  const isValid = eval(automation.conditions + (invertedConditions ? ' && ' + invertedConditions : ''));
  if (!isValid) return false;

  if (LOGS) console.log(`Beholder evaluated a condition at automation: ${automation.name}`);

  if (!automation.actions) {
    if (LOGS) console.log(`No actions defined for automation ${automation.name}`);
    return false;
  }

  const settings = await getDefaultSettings();

}

function findAutomations(memoryKey) {
  const ids = BRAIN_INDEX[memoryKey];
  if (!ids) return [];
  return ids.map(id => BRAIN[id]);
}

function deleteMemory(symbol, index, interval) {
  try {
    const indexKey = interval ? `${index}_${interval}` : index;
    const memoryKey = `${symbol}:${indexKey}`;

    LOCK_MEMORY = true;
    delete MEMORY[memoryKey];

    if (LOGS) console.log(`Beholder memory delete: ${memoryKey}`);
  } finally {
    LOCK_MEMORY = false;
  }
}

function deleteBrainIndex(indexes, automationId) {
  if (typeof indexes === 'string') indexes = indexes.split(',');

  indexes.foreach(ix => {
    if (!BRAIN_INDEX[ix] || BRAIN_INDEX[ix].length === 0) return;
    const pos = BRAIN_INDEX[ix].findIndex(id => id === automationId);
    BRAIN_INDEX[ix].splice(pos, 1);
  });
}

function deleteBrain(automation) {
  try {
    LOCK_BRAIN = true;
    delete BRAIN[automation.id];
    deleteBrainIndex(automation.indexes.split(','), automation.id);
  } finally {
    LOCK_BRAIN = false;
  }
}

function getMemory(symbol, index, interval) {
  if (symbol && index) {
    const indexKey = interval ? `${index}_${interval}` : index;
    const memoryKey = `${symbol}:${indexKey}`;

    const result = MEMORY[memoryKey];
    return typeof result === 'object' ? { ...result } : result;
  }

  return { ...MEMORY };
}

function getBrainIndexes() {
  return { ...BRAIN_INDEX };
}

function flattenObject(obj) {
  let toReturn = {};

  for (let i in obj) {
    if (!obj.hasOwnProperty(i)) continue;

    if ((typeof obj[i]) === 'object' && obj[i] !== null) {
      let flatObject = flattenObject(obj[i]);
      for (let x in flattenObject) {
        if (!flatObject.hasOwnProperty(x)) continue;
        toReturn[i + '.' + x] = flatObject[x];
      }
    } else {
      toReturn[i] = obj[i];
    }
  }

  return toReturn;
}

function getEval(prop) {
  if (prop.indexOf('.') === -1) return `MEMORY['${prop}']`;

  const propSplit = prop.split('.');
  const memKey = propSplit[0];
  const memProp = prop.replace(memKey, '');
  return `MEMORY['${memKey}${memProp}']`;
}

function getMemoryIndexes() {
  return Object.entries(flattenObject(MEMORY)).map(prop => {
    const propSplit = prop[0].split(':');
    return {
      symbol: propSplit[0],
      variable: propSplit[1],
      eval: getEval(prop[0]),
      example: propSplit[1]
    }
  }).sort((a, b) => {
    if (a.variable < b.variable) return -1;
    if (a.variable > b.variable) return 1;
    return 0;
  });
}

function getBrain() {
  return { ...BRAIN };
}

module.exports = {
  updateMemory,
  deleteMemory,
  getMemoryIndexes,
  getMemory,
  getBrain,
  updateBrain,
  getBrainIndexes,
  deleteBrain,
  init
}