const { indexKeys } = require('./utils/indexes');
const beholder = require('./beholder');

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

  return beholder.updateMemory(symbol, index, interval, newMemory, executeAutomations);
}

async function updateTickerMemory(symbol, index, ticker, executeAutomations = true) {
  const currentMemory = await getMemory(symbol, indexKeys.TICKER);

  const newMemory = {};
  newMemory.previous = currentMemory ? currentMemory.current : ticker;
  newMemory.current = ticker;

  return beholder.updateMemory(symbol, index, interval, newMemory, executeAutomations);
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

async function updateMemory(symbol, index, interval, value, executeAutomations = true) {
  if (value === undefined || value === null) return false;
  if (value.toJSON) value = value.toJSON();
  if (value.get) value = value.get({ plain: true });

  if (index === indexKeys.BOOK) {
    return updateBookMemory(symbol, index, value, executeAutomations);
  } else if (index.startsWith(indexKeys.LAST_ORDER + "_")) {
    return beholder.updateMemory(symbol, index, interval, getLightOrder(value), executeAutomations);
  } else if (index === indexKeys.TICKER) {
    return updateTickerMemory(symbol, index, value, executeAutomations);
  } else {
    return beholder.updateMemory(symbol, index, interval, value, executeAutomations);
  }
}

function deleteMemory(symbol, index, interval) {
  const indexKey = interval ? `${index}_${interval}` : index;
  const memoryKey = `${symbol}:${indexKey}`;
  beholder.deleteMemory(memoryKey);
}

function clearWallet(userId) {
  const balances = beholder.searchMemory(new RegExp(`^(.+:WALLET_${userId})$`));
  balances.map(b => beholder.deleteMemory(b.key));
}

function init(users) {
  beholder.init(users.map(u => u.automations).flat().filter(a => a.isActive && !a.schedule));
}

module.exports = {
  updateMemory,
  deleteMemory,
  clearWallet,
  init
}