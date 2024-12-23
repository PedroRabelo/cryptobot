const { indexKeys } = require('./utils/indexes');
const beholder = require('./beholder');

const Cache = require('./utils/cache');
const logger = require('./utils/logger');
const cache = new Cache();

const LOGS = process.env.HYDRA_LOGS === 'true'

function getLightBook(order) {
  const orderCopy = { ...order };
  delete orderCopy.symbol;
  delete orderCopy.updateId;
  delete orderCopy.bestAskQty;
  delete orderCopy.bestBidQty;
  return orderCopy;
}

async function updateBookMemory(symbol, index, value, executeAutomations = true) {
  const orderCopy = getLightBook(value);
  const converted = {};
  Object.entries(orderCopy).map(prop => converted[prop[0]] = parseFloat(prop[1]));

  const currentMemory = await getMemory(symbol, indexKeys.BOOK, testingUserId);

  const newMemory = {};
  newMemory.previous = currentMemory ? currentMemory.current : converted;
  newMemory.current = converted;

  return setCache(symbol, index, interval, newMemory, executeAutomations);
}

async function updateTickerMemory(symbol, index, ticker, executeAutomations = true) {
  const currentMemory = await getMemory(symbol, indexKeys.TICKER);

  const newMemory = {};
  newMemory.previous = currentMemory ? currentMemory.current : ticker;
  newMemory.current = ticker;

  return setCache(symbol, index, interval, newMemory, executeAutomations);
}

function getLightOrder(order) {
  const orderCopy = { ...order };
  delete orderCopy.id;
  delete orderCopy.symbol;
  delete orderCopy.automationId;
  delete orderCopy.orderId;
  delete orderCopy.clientOrderId;
  delete orderCopy.transactTime;
  delete orderCopy.isMaker;
  delete orderCopy.commission;
  delete orderCopy.obs;
  delete orderCopy.automation;
  delete orderCopy.createdAt;
  delete orderCopy.updatedAt;

  orderCopy.limitPrice = orderCopy.limitPrice ? parseFloat(orderCopy.limitPrice) : null;
  orderCopy.stopPrice = orderCopy.stopPrice ? parseFloat(orderCopy.stopPrice) : null;
  orderCopy.avgPrice = orderCopy.avgPrice ? parseFloat(orderCopy.avgPrice) : null;
  orderCopy.net = orderCopy.net ? parseFloat(orderCopy.net) : null;
  orderCopy.quantity = orderCopy.quantity ? parseFloat(orderCopy.quantity) : null;
  orderCopy.icebergQty = orderCopy.icebergQty ? parseFloat(orderCopy.icebergQty) : null;
  return orderCopy;
}

async function setCache(symbol, index, interval, value, executeAutomations = true) {
  const indexKey = interval ? `${index}_${interval}` : index;
  const memoryKey = `${symbol}:${indexKey}`;

  await cache.set(memoryKey, value, executeAutomations);

  if (LOGS) logger('hydra', `Hydra memory updated: ${memoryKey} => ${JSON.stringify(value)}, executeAutomations? ${executeAutomations}`);
}

async function updateMemory(symbol, index, interval, value, executeAutomations = true) {
  if (value === undefined || value === null) return false;
  if (value.toJSON) value = value.toJSON();
  if (value.get) value = value.get({ plain: true });

  if (index === indexKeys.BOOK) {
    return updateBookMemory(symbol, index, value, executeAutomations);
  } else if (index.startsWith(indexKeys.LAST_ORDER + "_")) {
    return setCache(symbol, index, interval, getLightOrder(value), executeAutomations);
  } else if (index === indexKeys.TICKER) {
    return updateTickerMemory(symbol, index, value, executeAutomations);
  } else {
    return setCache(symbol, index, interval, value, executeAutomations);
  }
}

function deleteMemory(symbol, index, interval) {
  const indexKey = interval ? `${index}_${interval}` : index;
  const memoryKey = `${symbol}:${indexKey}`;
  return cache.unset(memoryKey);
}

async function clearWallet(userId) {
  const balances = await searchMemory(new RegExp(`^(.+:WALLET_${userId})$`));
  await Promise.all(balances.map(b => cache.unset(b.key)));
}

function updateBrain(automation) {
  beholder.updateBrain(automation);
}

function deleteBrain(automation) {
  beholder.deleteBrain(automation);
}

async function generateGrids(automation, levels, quantity, transaction) {
  return beholder.generateGrids(automation, levels, quantity, transaction);
}

async function getMemory(symbolOrKey, index = undefined, interval = undefined) {
  if (symbolOrKey && index) {
    const indexKey = interval ? `${index}_${interval}` : index;
    const memoryKey = `${symbolOrKey}:${indexKey}`;

    return await cache.get(memoryKey);
  } else if (symbolOrKey)
    return cache.get(symbolOrKey);
  else
    return cache.search()
}

function getEval(prop) {
  if (prop.indexOf('.') === -1) return `MEMORY['${prop}']`;

  const propSplit = prop.split('.');
  const memKey = propSplit[0];
  const memProp = prop.replace(memKey, '');
  return `MEMORY['${memKey}${memProp}']`;
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

async function getMemoryIndexes() {
  const MEMORY = await getMemory()
  return Object.entries(flattenObject(MEMORY)).map(prop => {
    if (prop[0].indexOf('previous') !== -1 || prop[0].indexOf(':') === -1) return false;
    const propSplit = prop[0].split(':');
    return {
      symbol: propSplit[0],
      variable: propSplit[1].replace('.current', ''),
      eval: getEval(prop[0]),
      example: propSplit[1]
    }
  })
    .filter(ix => ix)
    .sort((a, b) => {
      if (a.variable < b.variable) return -1;
      if (a.variable > b.variable) return 1;
      return 0;
    });
}

function getBrainIndexes() {
  return { ...BRAIN_INDEX };
}

function getBrain() {
  return { ...BRAIN };
}

const DOLLAR_COINS = ['USD', 'USDT', 'USDC', 'BUSD'];

function getStableConversion(baseAsset, quoteAsset, baseQty) {
  if (DOLLAR_COINS.includes(baseAsset)) return baseQty;

  const book = getMemory(baseAsset + quoteAsset, 'BOOK', null);
  if (book) return parseFloat(baseQty) * book.current.bestBid;
  return 0;
}

const FIAT_COINS = ['BRL', 'EUR', 'GBP'];

async function getFiatConversion(stableCoin, fiatCoin, fiatQty) {
  const book = await getMemory(stableCoin + fiatCoin, 'BOOK', null);
  if (book) return parseFloat(fiatQty) / book.current.bestBid;
  return 0;
}

async function searchMemory() {
  const MEMORY = await getMemory();
  return Object.entries(MEMORY).filter(prop => regex.test(prop[0])).map(prop => {
    return {
      key: prop[0], value: prop[1]
    }
  });
}

async function tryUSDConversion(baseAsset, baseQty) {
  if (DOLLAR_COINS.includes(baseAsset)) return baseQty;
  if (FIAT_COINS.includes(baseAsset)) return getFiatConversion('USDT', baseAsset, baseQty);

  for (let i = 0; i < DOLLAR_COINS.length; i++) {
    const converted = getStableConversion(baseAsset, DOLLAR_COINS[i], baseQty);
    if (converted > 0) return converted;
  }

  return 0;
}

async function tryFiatConversion(baseAsset, baseQty, fiat) {
  if (fiat) fiat = fiat.toUpperCase();
  if (FIAT_COINS.includes(baseAsset) && baseAsset === fiat) return baseQty;

  const usd = tryUSDConversion(baseAsset, baseQty);
  if (fiat === 'USD' || !fiat) return usd;

  let book = await getMemory('USDT' + fiat, 'BOOK');
  if (book) usd * book.current.bestBid;

  book = await getMemory(fiat + 'USDT', 'BOOK');
  if (book) return usd / book.current.bestBid;

  return usd;
}

function evalDecision(memoryKey, automation) {
  return beholder.evalDecision(memoryKey, automation)
}

function init(users) {
  beholder.init(users.map(u => u.automations).flat().filter(a => a.isActive && !a.schedule));
}

module.exports = {
  updateMemory,
  deleteMemory,
  clearWallet,
  updateBrain,
  deleteBrain,
  generateGrids,
  getMemory,
  getMemoryIndexes,
  getBrainIndexes,
  getBrain,
  tryUSDConversion,
  tryFiatConversion,
  searchMemory,
  evalDecision,
  init
}