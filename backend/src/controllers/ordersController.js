const ordersRepository = require('../repositories/ordersRepository');
const settingsRepository = require('../repositories/settingsRepository');
const orderTemplatesRepository = require('../repositories/orderTemplatesRepository');
const automationRepository = require('../repositories/automationsRepository');
const actionsRepository = require('../repositories/actionsRepository');
const usersRepository = require('../repositories/usersRepository');
const hydra = require('../hydra');
const logger = require('../utils/logger');
const db = require('../db');
const appEm = require('../app-em');

function thirtyDaysAgo() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 30);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

function getStartToday() {
  const date = new Date();
  date.setUTCHours(0, 0, 0);
  return date.getTime();
}

function getToday() {
  const date = new Date();
  date.setUTCHours(23, 59, 59, 999);
  return date.getTime();
}

function calcVolume(orders, side, startTime, endTime) {
  startTime = !startTime ? 0 : startTime;
  endTime = !endTime ? Date.now() : endTime;

  const filteredOrders = orders.filter(o => o.transactTime >= startTime && o.transactTime < endTime && o.side === side);
  if (!filteredOrders || !filteredOrders.length) return 0;

  return filteredOrders.map(o => parseFloat(o.net))
    .reduce((a, b) => a + b);
}

async function getOrdersReport(req, res, next) {
  if (req.query.date) {
    return getDayTradeReport(req, res, next);
  } else {
    return getMonthReport(req, res, next);
  }
}

const EMPTY_REPORT = {
  orders: 0,
  buyVolume: 0,
  sellVolume: 0,
  wallet: 0,
  profit: 0,
  profitPerc: 0,
  subs: [],
  series: [],
  automations: []
}

function groupByAutomations(orders) {
  const automationsObj = {};
  orders.forEach(o => {
    const automationId = o.automationId ?? 'M';
    if (!automationsObj[automationId]) {
      automationsObj[automationId] = {
        name: o.automationId ? o['automation.name'] : 'Others',
        executions: 1,
        net: 0
      }
    } else {
      automationsObj[automationId].executions++;
    }

    if (o.side === 'BUY')
      automationsObj[automationId].net -= parseFloat(o.net);
    else
      automationsObj[automationId].net += parseFloat(o.net);
  })

  return Object.entries(automationsObj).map(prop => prop[1]).sort((a, b) => b.net - a.net);
}

async function getDayTradeReport(req, res, next) {
  const userId = res.locals.token.id;
  const quote = req.params.quote;

  let startDate = req.query.startDate ? parseInt(req.query.startDate) : getStartToday();
  let endDate = startDate + (23 * 60 * 60 * 1000) + (59 * 60 * 1000) + (59 * 1000) + 999;

  // permitir apenas 24h
  if ((endDate - startDate) > (1 * 24 * 60 * 60 * 1000)) startDate = getStartToday();

  const orders = await ordersRepository.getReportOrders(userId, quote, startDate, endDate);
  const wallet = hydra.getMemory(quote, 'WALLET_' + userId);

  if (!orders || !orders.length) return res.json({ ...EMPTY_REPORT, quote, startDate, endDate });

  const subs = [];
  const series = [];
  for (let i = 0; i < 24; i++) {
    const newDate = new Date(startDate);
    newDate.setUTCHours(i);
    subs.push(`${i}h`);

    const lastMoment = new Date(newDate.getTime());
    lastMoment.setUTCMinutes(59, 59, 999);

    const partialBuy = calcVolume(orders, 'BUY', newDate.getTime(), lastMoment.getTime());
    const partialSell = calcVolume(orders, 'SELL', newDate.getTime(), lastMoment.getTime());
    series.push(partialSell - partialBuy);
  }

  const buyVolume = calcVolume(orders, 'BUY');
  const sellVolume = calcVolume(orders, 'SELL');
  const profit = sellVolume - buyVolume;

  const profitPerc = (profit * 100) / (parseFloat(wallet) - profit);

  const automations = groupByAutomations(orders);

  res.json({
    quote,
    orders: orders.length,
    buyVolume,
    sellVolume,
    wallet,
    profit,
    profitPerc,
    startDate,
    endDate,
    subs,
    series,
    automations
  })
}

async function getMonthReport(req, res, next) {
  const userId = res.locals.token.id;
  const quote = req.params.quote;

  let startDate = req.query.startDate ? parseInt(req.query.startDate) : thirtyDaysAgo();
  let endDate = req.query.endDate ? parseInt(req.query.endDate) : getToday();

  if ((endDate - startDate) > (31 * 24 * 60 * 60 * 1000)) startDate = thirtyDaysAgo();

  const orders = await ordersRepository.getReportOrders(userId, quote, startDate, endDate);
  const wallet = hydra.getMemory(quote, 'WALLET_' + userId);

  if (!orders || !orders.length) return res.json({ ...EMPTY_REPORT, quote, startDate, endDate });

  const daysInRange = Math.ceil(endDate - startDate) / (24 * 60 * 60 * 1000);

  const subs = [];
  const series = [];
  for (let i = 0; i < daysInRange; i++) {
    const newDate = new Date(startDate);
    newDate.setUTCDate(newDate.getUTCDate() + i);
    subs.push(`${newDate.getUTCDate()}/${newDate.getUTCMonth() + 1}`);

    const lastMoment = new Date(newDate.getTime());
    lastMoment.setUTCHours(23, 59, 59, 999);

    const partialBuy = calcVolume(orders, 'BUY', newDate.getTime(), lastMoment.getTime());
    const partialSell = calcVolume(orders, 'SELL', newDate.getTime(), lastMoment.getTime());
    series.push(partialSell - partialBuy);
  }

  const buyVolume = calcVolume(orders, 'BUY');
  const sellVolume = calcVolume(orders, 'SELL');
  const profit = sellVolume - buyVolume;

  const profitPerc = (profit * 100) / (parseFloat(wallet) - profit);

  const automations = groupByAutomations(orders);

  res.json({
    quote,
    orders: orders.length,
    buyVolume,
    sellVolume,
    wallet,
    profit,
    profitPerc,
    startDate,
    endDate,
    subs,
    series,
    automations
  })
}

async function getOrders(req, res, next) {
  const userId = res.locals.token.id;
  const symbol = req.params.symbol && req.params.symbol.toUpperCase();
  const page = parseInt(req.query.page);
  const orders = await ordersRepository.getOrders(userId, symbol, page || 1);
  res.json(orders);
}

async function getLastFilledOrders(req, res, next) {
  const userId = res.locals.token.id;
  const orders = await ordersRepository.getLastFilledOrders(userId);
  res.json(orders);
}

function calcTrailingStop(side, limitePrice, stopPriceMultiplier) {
  return side === 'BUY' ? limitPrice * (1 + (stopPriceMultiplier / 100))
    : limitPrice * (1 - (stopPriceMultiplier / 100))
}

function saveOrderTemplate(order, timestamp, transaction) {
  const stopPriceMultiplier = parseFloat(order.options.stopPriceMultiplier);
  const orderTemplate = {
    name: `TRAILING ${order.side} ${timestamp}`,
    symbol: order.symbol,
    type: order.options.type,
    side: order.side,
    limitPrice: order.limitPrice,
    limitPriceMultiplier: 1,
    stopPrice: calcTrailingStop(order.side, order.limitPrice, stopPriceMultiplier),
    stopPriceMultiplier,
    quantity: order.quantity,
    quantityMultiplier: 1,
    icebergQtyMultiplier: 1
  }

  return orderTemplatesRepository.insertOrderTemplate(orderTemplate, transaction);
}

function saveAutomation(order, timestamp, transaction) {
  const conditions = order.side === 'BUY'
    ? `MEMORY['${order.symbol}:BOOK'].current.bestAsk<=${order.limitPrice}`
    : `MEMORY['${order.symbol}:BOOK'].current.bestBid>=${order.limitPrice}`

  const automation = {
    name: `TRAILING ${order.side} ${timestamp}`,
    symbol: order.symbol,
    indexes: `${order.symbol}:BOOK`,
    conditions,
    isActive: true,
    logs: false
  }

  return automationRepository.insertAutomation(automation, transaction);
}

function saveAction(automationId, orderTemplateId, transaction) {
  const action = {
    type: 'TRAILING',
    automationId,
    orderTemplateId
  }
  return actionsRepository.insertActions([action], transaction);
}

async function placeTrailingStop(req, res, next) {
  const order = req.body;

  const transaction = await db.transaction();
  const timestamp = Date.now();

  try {
    const orderTemplate = await saveOrderTemplate(order, timestamp, transaction);

    let automation = await saveAutomation(order, timestamp, transaction);

    await saveAction(automation.id, orderTemplate.id, transaction);

    await transaction.commit();

    automation = await automationRepository.getAutomation(automation.id);

    beholder.updateBrain(automation);

    await appEm.sendMessage({ notification: { type: 'success', text: 'Trailing stop placed!' } });

    return res.status(202).send(`Trailing stop placed!`);
  } catch (err) {
    await transaction.rollback();
    logger('system', err);
    return res.status(500).send(err.message);
  }
}

async function placeOrder(req, res, next) {
  if (req.body.options.type === 'TRAILING_STOP') return placeTrailingStop(req, res, next);

  const userId = res.locals.token.id;
  const user = await usersRepository.getUserDecrypted(userId);
  const settings = await settingsRepository.getDefaultSettings();
  const exchange = require('../utils/exchange')(settings.get({ plain: true }), user.get({ plain: true }));

  const { side, symbol, quantity, limitPrice, options, automationId } = req.body;

  let result;
  try {
    if (side === 'BUY')
      result = await exchange.buy(symbol, quantity, limitPrice, options);
    else
      result = await exchange.sell(symbol, quantity, limitPrice, options);
  } catch (err) {
    return res.status(400).json(err.body);
  }

  const order = await ordersRepository.insertOrder({
    automationId,
    userId,
    symbol,
    quantity,
    type: options ? options.type : 'MARKET',
    side,
    limitPrice,
    stopPrice: options ? options.stopPrice : null,
    icebergQuantity: options ? options.icebergQty : null,
    orderId: result.orderId,
    clientOrderId: result.clientOrderId,
    transactTime: result.transactTime,
    status: result.status || 'NEW'
  })

  res.status(201).json(order.get({ plain: true }));
}

async function cancelOrder(req, res, next) {
  const userId = res.locals.token.id;
  const user = await usersRepository.getUserDecrypted(userId);
  const settings = await settingsRepository.getDefaultSettings();
  const exchange = require('../utils/exchange')(settings, user);

  const { symbol, orderId } = req.params;

  try {
    result = await exchange.cancel(symbol, orderId);
  } catch (err) {
    return res.status(400).json(err.body);
  }

  const order = await ordersRepository.updateOrderByOrderId(result.orderId, result.origClientOrderId, {
    status: result.status
  })

  res.json(order.get({ plain: true }));
}

async function syncOrder(req, res, next) {
  const userId = res.locals.token.id;
  const user = await usersRepository.getUserDecrypted(userId);
  const settings = await settingsRepository.getDefaultSettings();
  const exchange = require('../utils/exchange')(settings, user);

  const beholderOrderId = req.params.id;
  const order = await ordersRepository.getOrderById(beholderOrderId);
  if (!order) return res.sendStatus(404);

  let binanceOrder, binanceTrade;
  try {
    binanceOrder = await exchange.orderStatus(order.symbol, order.orderId);
    order.status = binanceOrder.status;
    order.transactTime = binanceOrder.updateTime;

    if (binanceOrder.status !== 'FILLED') {
      await order.save();
      return res.json(order);
    }

    binanceTrade = await exchange.orderTrade(order.symbol, order.orderId);
  } catch (err) {
    logger('system', err);
    return res.sendStatus(404);
  }

  const quoteQuantity = parseFloat(binanceOrder.cumulativeQuoteQty);
  order.avgPrice = quoteQuantity / parseFloat(binanceOrder.executedQty);
  order.isMaker = binanceTrade?.isMaker;
  order.commission = binanceTrade?.commission;

  const isQuoteCommision = binanceTrade.commissionAsset && order.symbol.endsWith(binanceTrade.commissionAsset);
  if (isQuoteCommision)
    order.net = quoteQuantity - parseFloat(binanceTrade.commission);
  else
    order.net = quoteQuantity;

  await order.save();

  res.json(order);
}

module.exports = {
  getOrdersReport,
  getOrders,
  placeOrder,
  cancelOrder,
  syncOrder,
  getLastFilledOrders
}