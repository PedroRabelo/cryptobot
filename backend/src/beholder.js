const { getDefaultSettings } = require('./repositories/settingsRepository');
const { actionsTypes } = require('./repositories/actionsRepository');
const orderTemplatesRepository = require('./repositories/orderTemplatesRepository');
const { getSymbol } = require('./repositories/symbolsRepository');
const { STOP_TYPES, LIMIT_TYPES, insertOrder } = require('./repositories/ordersRepository');
const db = require('./db');
const automationsRepository = require('./repositories/automationsRepository');

const MEMORY = {}

let BRAIN = {}
let BRAIN_INDEX = {}

let LOCK_MEMORY = false;

let LOCK_BRAIN = false;

const INTERVAL = parseInt(process.env.AUTOMATION_INTERVAL || 0);

const LOGS = process.env.BEHOLDER_LOGS === 'true';

function init(automations) {
  try {
    LOCK_BRAIN = true;
    LOCK_MEMORY = true;

    BRAIN = {};
    BRAIN_INDEX = {};

    automations.map(auto => {
      if (auto.isActive && !auto.schedule)
        updateBrain(auto)
    });

  } finally {
    LOCK_BRAIN = false;
    LOCK_MEMORY = false;
    console.log('Beholder Brain has started!');
  }
}

function updateBrain(automation) {
  if (!automation.isActive || !automation.conditions) return;

  const actions = automation.actions ? automation.actions.map(a => {
    a = a.toJSON ? a.toJSON() : a;
    delete a.createdAt;
    delete a.updatedAt;
    //delete a.orderTemplate;

    return a;
  }) : [];

  const grids = automation.grids ? automation.grids.map(g => {
    g = g.toJSON ? g.toJSON() : g;
    delete g.createdAt;
    delete g.updatedAt;
    delete g.automationId;
    if (g.orderTemplate) {
      delete g.orderTemplate.createdAt;
      delete g.orderTemplate.updatedAt;
      delete g.orderTemplate.name;
    }
    return g;
  }) : [];

  if (automation.toJSON)
    automation = automation.toJSON();

  delete automation.createdAt;
  delete automation.updatedAt;

  automation.actions = actions;
  automation.grids = grids;

  BRAIN[automation.id] = automation;
  automation.indexes.split(',').map(ix => updateBrainIndex(ix, automation.id));
}

function updateBrainIndex(index, automationId) {
  if (!BRAIN_INDEX[index]) BRAIN_INDEX[index] = [];
  BRAIN_INDEX[index].push(automationId);
}

function parseMemoryKey(symbol, index, interval = null) {
  const indexKey = interval ? `${index}_${interval}` : index;
  return `${symbol}:${indexKey}`;
}

async function updateMemory(symbol, index, interval, value, executeAutomations = true) {

  if (value === undefined || value === null) return false;
  if (value.toJSON) value = value.toJSON();
  if (value.get) value = value.get({ plain: true });

  if (LOCK_MEMORY) return false;

  const memoryKey = parseMemoryKey(symbol, index, interval);
  MEMORY[memoryKey] = value;

  if (LOGS) console.log(`Beholder memory updated: ${memoryKey} => ${JSON.stringify(value)}`);

  if (LOCK_BRAIN) {
    if (LOGS) console.log(`Beholder brain is locked, sorry`);
    return false;
  }

  if (!executeAutomations) return false;

  const automations = findAutomations(memoryKey);
  if (!automations || !automations.length && LOCK_BRAIN) return false;

  LOCK_BRAIN = true;
  let results;

  try {
    const promises = automations.map(async (auto) => {
      return evalDecision(memoryKey, auto);
    });

    results = await Promise.all(promises);
    results = results.flat().filter(r => r);

    if (!results || !results.length)
      return false;
    else
      return results;
  } finally {
    if (results && results.length) {
      setTimeout(() => {
        LOCK_BRAIN = false;
      }, INTERVAL);
    } else
      LOCK_BRAIN = false;
  }
}

function invertCondition(memoryKey, conditions) {
  const conds = conditions.split(' && ');
  const condToInvert = conds.find(c => c.indexOf(memoryKey) !== -1 && c.indexOf('current') !== -1);
  if (!condToInvert) return false;

  if (condToInvert.indexOf('>=') != -1) return condToInvert.replace('>=', '<').replace(/current/g, 'previous');
  if (condToInvert.indexOf('<=') != -1) return condToInvert.replace('<=', '>').replace(/current/g, 'previous');
  if (condToInvert.indexOf('>') != -1) return condToInvert.replace('>', '<').replace(/current/g, 'previous');
  if (condToInvert.indexOf('<') != -1) return condToInvert.replace('<', '>').replace(/current/g, 'previous');
  if (condToInvert.indexOf('!') != -1) return condToInvert.replace('!', '=').replace(/current/g, 'previous');
  if (condToInvert.indexOf('==') != -1) return condToInvert.replace('==', '!==').replace(/current/g, 'previous');
  return false;
}

async function sendEmail(settings, automation) {
  await require('./utils/email')(settings, `${automation.name} has fired! ${automation.conditions}`);
  if (automation.logs) console.log('E-mail sent!');
  return { type: 'success', text: `E-mail sent from automation ${automation.name}` };
}

async function sendSms(settings, automation) {
  await require('./utils/sms')(settings, `${automation.name} has fired!`);
  if (automation.logs(console.log('SMS sent!')));
  return { type: 'success', text: `SMS sent from automation ${automation.name}!` };
}

function calcPrice(orderTemplate, symbol, isStopPrice) {
  const tickSize = parseFloat(symbol.tickSize);
  let newPrice, factor;

  if (LIMIT_TYPES.includes(orderTemplate.type)) {
    try {
      if (!stopPrice) {
        if (parseFloat(orderTemplate.limitPrice)) return orderTemplate.limitPrice;
        newPrice = eval(getEval(orderTemplate.limitPrice)) * orderTemplate.limitPriceMultiplier;
      } else {
        if (parseFloat(orderTemplate.stopPrice)) return orderTemplate.stopPrice;
        newPrice = eval(getEval(orderTemplate.stopPrice)) * orderTemplate.stopPriceMultiplier;
      }
    } catch (error) {
      if (isStopPrice)
        throw new Error(`Error trying to calc Stop Price with params; ${orderTemplate.stopPrice} x ${orderTemplate.stopPriceMultiplier}. Error: ${err.message}`);
      else
        throw new Error(`Error trying to calc Limite Price with params; ${orderTemplate.limitPrice} x ${orderTemplate.limitPriceMultiplier}. Error: ${err.message}`);
    }
  } else {
    const memory = MEMORY[`${orderTemplate.symbol}:BOOK`];
    if (!memory)
      throw new Error(`Error trying to get market price. OTID: ${orderTemplate.id}, ${isStopPrice}. No book`);

    newPrice = orderTemplate.side === 'BUY' ? memory.current.bestAsk : memory.current.bestBid;
    newPrice = isStopPrice ? newPrice * orderTemplate.stopPriceMultiplier : newPrice * orderTemplate.limitPriceMultiplier;
  }

  factor = Math.floor(newPrice / tickSize);
  return (factor * tickSize).toFixed(symbol.quotePrecision);
}

function calcQty(orderTemplate, price, symbol, isIceberg) {
  let asset;

  if (orderTemplate.side === 'BUY') {
    asset = parseFloat(MEMORY[`${symbol.quote}:WALLET`]);
    if (!asset) throw new Error(`There is no ${symbol.quote} in you wallet to place a buy.`);
  } else {
    asset = parseFloat(MEMORY[`${symbol.base}:WALLET`]);
    if (!asset) throw new Error(`There is no ${symbol.base} in you wallet to place a sell.`);
  }

  let qty = isIceberg ? orderTemplate.icebergQty : orderTemplate.quantity;
  qty = qty.replace(',', '.');

  if (parseFloat(qty)) return qty;

  const multiplier = isIceberg ? orderTemplate.icebergQtyMultiplier : orderTemplate.quantityMultiplier;
  const stepSize = parseFloat(symbol.stepSize);

  let newQty, factor;
  if (orderTemplate.quantity === 'MAX_WALLET') {
    if (orderTemplate.side === 'BUY')
      newQty = (parseFloat(asset) / parseFloat(price)) * (multiplier > 1 ? 1 : multiplier);
    else
      newQty = parseFloat(asset) * (multiplier > 1 ? 1 : multiplier);
  } else if (orderTemplate.quantity === 'MIN_NOTIONAL') {
    newQty = (parseFloat(symbol.minNotional) / parseFloat(price)) * (multiplier < 1 ? 1 : multiplier);
  } else if (orderTemplate.quantity === 'LAST_ORDER_QTY') {
    const lastOrder = MEMORY[`${orderTemplate.symbol}:LAST_ORDER`];
    if (!lastOrder)
      throw new Error(`There is no last order to use as qty reference for ${orderTemplate.symbol}`);

    newQty = parseFloat(lastOrder.quantity) * multiplier;
    if (orderTemplate.side === 'SELL' && newQty > asset) newQty = asset;
  }

  factor = Math.floor(newQty / stepSize);
  return (factor * stepSize).toFixed(symbol.basePrecision);
}

function hasEnoughAssets(symbol, order, price) {
  const qty = order.type === 'ICEBERG' ? parseFloat(order.options.icebergQty) : parseFloat(order.quantity);
  if (order.side === 'BUY') {
    return parseFloat(MEMORY[`${symbol.quote}:WALLET`]) >= (price * qty);
  } else {
    return parseFloat(MEMORY[`${symbol.base}:WALLET`]) >= qty;
  }
}

async function placeOrder(settings, automation, action) {
  if (!settings || !automation || !action)
    throw new Error(`All parameters are required to place an order`);

  if (!action.orderTemplateId)
    throw new Error(`There is no order template for ${automation.name}, action ${action.id}`);

  const orderTemplate = await orderTemplatesRepository.getOrderTemplate(action.orderTemplateId);
  const symbol = await getSymbol(orderTemplate.symbol);

  const order = {
    symbol: orderTemplate.symbol.toUpperCase(),
    side: orderTemplate.side.toUpperCase(),
    type: orderTemplate.type.toUpperCase()
  }

  const price = calcPrice(orderTemplate, symbol, false);

  if (!isFinite(price) || !price)
    throw new Error(`Error in calcPrice function, params: OTID ${orderTemplate.id}, $: ${price}, stop: false`);

  if (LIMIT_TYPES.includes(order.type))
    order.limitPrice = price;

  const quantity = calcQty(orderTemplate, price, symbol, false);

  if (!isFinite(quantity) || !quantity)
    throw new Error(`Error in calcQty function, params: OTID ${orderTemplate.id}, $: ${price}, iceberg: false`);

  order.quantity = quantity;

  if (order.type === 'ICEBERG') {
    const icebergQty = calcQty(orderTemplate, price, symbol, true);

    if (!isFinite(icebergQty) || !icebergQty)
      throw new Error(`Error in calcQty function, params: OTID ${orderTemplate.id}, $: ${price}, iceberg: true`);

    order.options = { icebergQty };
  }
  else if (STOP_TYPES.includes(order.type)) {
    const stopPrice = calcPrice(orderTemplate, symbol, true);

    if (!isFinite(stopPrice) || !stopPrice)
      throw new Error(`Error in calcPrice function, params: OTID ${orderTemplate.id}, $: ${stopPrice}, stop: true`);

    order.options = { stopPrice, type: order.type };
  }

  if (!hasEnoughAssets(symbol, order, price))
    throw new Error(`You wanna ${order.side} ${order.quantity} ${order.symbol} but you haven't enough assets`);

  let result;
  const exchange = require('./utils/exchange')(settings);

  try {

    if (order.side === 'BUY')
      result = await exchange.buy(order.symbol, order.quantity, order.limitPrice, order.options);
    else
      result = await exchange.sell(order.symbol, order.quantity, order.limitPrice, order.options);
  } catch (error) {
    console.error(error.body ? error.body : error);
    console.log(order);
    return { type: 'error', text: `Order failed!` + error.body ? error.body : error };
  }

  const savedOrder = await insertOrder({
    automationId: automation.id,
    symbol: order.symbol,
    quantity: order.quantity,
    type: order.type,
    side: order.side,
    limitPrice: LIMIT_TYPES.includes(order.type) ? order.limitPrice : null,
    stopPrice: STOP_TYPES.includes(order.type) ? order.options.stopPrice : null,
    icebergQty: order.type === 'ICEBERG' ? order.options.icebergQty : null,
    orderId: result.orderId,
    clientOrderId: result.clientOrderId,
    transactTime: result.transactTime,
    status: result.status,
  })

  if (automation.logs) console.log(savedOrder.get({ plain: true }));

  return { type: 'success', text: `Order #${result.orderId} placed with status ${result.status}` }
}

async function generateGrids(automation, levels, quantity, transaction) {
  await gridsRepository.deleteGrids(automation.id, transaction);

  const symbol = await getSymbol(automation.symbol);
  const tickSize = parseFloat(symbol.tickSize);

  const conditionSplit = automation.conditions.split(' && ');
  const lowerLimit = parseFloat(conditionSplit[0].split('>')[1]);
  const upperLimit = parseFloat(conditionSplit[1].split('<')[1]);
  levels = parseInt(levels);

  const priceLevel = (upperLimit - lowerLimit) / levels;
  const grids = [];

  let buyOrderTemplate, sellOrderTemplate;
  const orderTemplates = await orderTemplatesRepository.getOrderTemplatesByGridName(automation.name);

  if (orderTemplates && orderTemplates.length) {
    buyOrderTemplate = orderTemplates.find(ot => ot.side === 'BUY');
    if (buyOrderTemplate && buyOrderTemplate.quantity !== quantity) {
      buyOrderTemplate.quantity = quantity;
      await orderTemplatesRepository.updateOrderTemplate(buyOrderTemplate.id, buyOrderTemplate);
    }

    sellOrderTemplate = orderTemplates.find(ot => ot.side === 'SELL');
    if (sellOrderTemplate && sellOrderTemplate.quantity !== quantity) {
      sellOrderTemplate.quantity = quantity;
      await orderTemplatesRepository.updateOrderTemplate(sellOrderTemplate.id, sellOrderTemplate);
    }
  }

  if (!buyOrderTemplate)
    buyOrderTemplate = await orderTemplatesRepository.insertOrderTemplate({
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

  if (!sellOrderTemplate)
    sellOrderTemplate = await orderTemplatesRepository.insertOrderTemplate({
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

  const currentPrice = parseFloat(MEMORY[`${automation.symbol}:BOOK`].current.bestAsk);
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

async function gridEval(settings, automation) {
  automation.grids = automation.grids.sort((a, b) => a.id - b.id);

  if (LOGS)
    console.log(`Beholder is in the GRID zone at ${automation.name}`);

  for (let i = 0; i < automation.grids.length; i++) {
    const grid = automation.grids[i];
    if (!eval(grid.conditions)) continue;

    if (automation.logs)
      console.log(`Beholder evaluated a condition at ${automation.name} => ${grid.conditions}`);

    automation.actions[0].orderTemplateId = grid.orderTemplateId;

    const book = MEMORY[`${automation.symbol}:BOOK`];
    if (!book) return { type: 'error', text: `No book info for ${automation.symbol}` };

    const result = await placeOrder(settings, automation, automation.actions[0]);
    if (result.type === 'error') return result;

    const transaction = await db.transaction();
    try {
      const orderTemplate = await orderTemplatesRepository.getOrderTemplate(grid.orderTemplateId);
      await generateGrids(automation, automation.grids.length + 1, orderTemplate.quantity, transaction);
      await transaction.commit();
    } catch {
      await transaction.rollback();
      console.error(err)
      return { type: 'error', text: `Beholder can't generate grids for ${automation.name}. ERR: ${err.message}` }
    }

    automation = await automationsRepository.getAutomation(automation.id);
    updateBrain(automation);

    return result;
  }
}

function doAction(settings, action, automation) {
  try {
    switch (action.type) {
      case actionsTypes.ALERT_EMAIL: return sendEmail(settings, automation);
      case actionsTypes.ALERT_SMS: return sendSms(settings, automation);
      case actionsTypes.ORDER: return placeOrder(settings, automation, action);
      case actionsTypes.GRID: return gridEval(settings, automation);
    }
  } catch (err) {
    if (automation.logs) {
      console.error(`${automation.name}:${action.type}`);
      console.error(err);
    }
    return { type: 'error', text: `Error at ${automation.name}: ${err.message}` };
  }
}

async function evalDecision(memoryKey, automation) {
  if (!automation) return false;

  try {
    const indexes = automation.indexes ? automation.indexes.split(',') : [];

    if (indexes.length) {
      const isChecked = indexes.every(ix => MEMORY[ix] !== null && MEMORY[ix] !== undefined);
      if (!isChecked) return false;

      const invertedCondition = automation.actions[0].type === 'GRID' || automation.schedule ? '' : invertCondition(memoryKey, automation.conditions);
      const evalCondition = automation.conditions + (invertedCondition ? `&& ${invertedCondition}` : '');

      if (LOGS) console.log(`Beholder is trying to evaluate a condition ${evalCondition}\n at automation ${automation.name}`);

      const isValid = evalCondition ? eval(evalCondition) : true;
      if (!isValid) return false;
    }

    if (!automation.actions || !automation.action.length) {
      if (LOGS || automation.logs) console.log(`No actions defined for automation ${automation.name}`);
      return false;
    }

    if ((LOGS || automation.logs) && automation.actions[0].type !== actionsTypes.GRID)
      console.log(`Beholder evaluated a condition at automation: ${automation.name}`);

    const settings = await getDefaultSettings();
    let results = [];

    for (let i = 0; i < automation.actions.length; i++) {
      const action = automation.action[i];
      results.push(await doAction(settings, action, automation));
    }

    if (automation.logs && results && results.length && results[0])
      console.log(`Automation ${automation.name} has fired!`);

    return results.flat();
  } catch (err) {
    if (automation.logs) console.error(err);
    return { type: 'error', text: `Error at evalDecision for '${automation.name}': ${err.message}` }
  }
}

function findAutomations(memoryKey) {
  const ids = BRAIN_INDEX[memoryKey];
  if (!ids) return [];
  return [...new Set(ids)].map(id => BRAIN[id]);
}

function deleteMemory(symbol, index, interval) {
  try {
    const indexKey = interval ? `${index}_${interval}` : index;
    const memoryKey = `${symbol}:${indexKey}`;
    if (MEMORY[memoryKey] === undefined) return;

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
    if (prop[0].indexOf('previous') !== -1) return false;
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

function getBrain() {
  return { ...BRAIN };
}

const STABLE_COINS = ['USD', 'USDT', 'USDC', 'BUSD'];

function getStableConversion(baseAsset, quoteAsset, baseQty) {
  if (STABLE_COINS.includes(baseAsset)) return baseQty;

  const book = getMemory(baseAsset + quoteAsset, 'BOOK', null);
  if (book) return parseFloat(baseQty) * book.current.bestBid;
  return 0;
}

const FIAT_COINS = ['BRL', 'EUR', 'GBP'];

function getFiatConversion(stableCoin, fiatCoin, fiatQty) {
  const book = getMemory(stableCoin + fiatCoin, 'BOOK', null);
  if (book) return parseFloat(fiatQty) / book.current.bestBid;
  return 0;
}

function tryUSDConversion(baseAsset, baseQty) {
  if (STABLE_COINS.includes(baseAsset)) return baseQty;
  if (FIAT_COINS.includes(baseAsset)) return getFiatConversion('USDT', baseAsset, baseQty);

  for (let i = 0; i < STABLE_COINS.length; i++) {
    const converted = getStableConversion(baseAsset, STABLE_COINS[i], baseQty);
    if (converted > 0) return converted;
  }

  return 0;
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
  init,
  placeOrder,
  tryUSDConversion,
  generateGrids,
  evalDecision
}