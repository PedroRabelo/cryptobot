const ordersRepository = require('./repositories/ordersRepository');
const { monitorTypes, getActiveSystemMonitors } = require('./repositories/monitorsRepository');
const { execCalc, indexKeys } = require('./utils/indexes');
const logger = require('./utils/logger');

let WSS, beholder, anonymousExchange;

function startMiniTickerMonitor(monitorId, broadcastLabel, logs) {
  if (!anonymousExchange) return new Error(`Exchange Monitor not initializer yet.`);

  anonymousExchange.miniTickerStream(async (markets) => {
    if (logs) logger('M:' + monitorId, markets);

    Object.entries(markets).map(async (mkt) => {
      delete mkt[1].volume;
      delete mkt[1].quoteVolume;
      delete mkt[1].eventTime;
      const converted = {};
      Object.entries(mkt[1]).map(prop => converted[prop[0]] = parseFloat(prop[1]));
      await beholder.updateMemory(mkt[0], indexKeys.MINI_TICKER, null, converted);
    })

    if (broadcastLabel && WSS)
      WSS.broadcast({ [broadcastLabel]: markets });

    //simulação de book
    const books = Object.entries(markets).map(async mkt => {
      const book = { symbol: mkt[0], bestAsk: mkt[1].close, bestBid: mkt[1].close };
      const currentMemory = beholder.getMemory(mkt[0], indexKeys.BOOK);

      const newMemory = {};
      newMemory.previous = currentMemory ? currentMemory.current : book;
      newMemory.current = book;

      await beholder.updateMemory(mkt[0], indexKeys.BOOK, null, newMemory);

      return book;
    })
    if (WSS) WSS.broadcast({ book: books });
    //fim da simulação de book
  });
  logger('M:' + monitorId, `Mini-Ticker Monitor has started at ${broadcastLabel}`);
}

async function loadWallet(settings, user) {
  const exchange = require('./utils/exchange')(settings, user);
  if (!exchange) return new Error(`Exchange Monitor not initializer yet.`);

  const info = await exchange.balance();
  const wallet = Object.entries(info).map(async (item) => {
    const results = await beholder.updateMemory(item[0], `${indexKeys.WALLET}_${user.id}`, null, parseFloat(item[1].available));
    if (results) results.map(r => WSS.direct(user.id, { notification: r }));

    return {
      symbol: item[0],
      available: item[1].available,
      onOrder: item[1].onOrder,
    }
  });
  return wallet;
}

function notifyOrderUpdate(userId, order) {
  let type = '';
  switch (order.status) {
    case 'FILLED': type = 'success'; break;
    case 'REJECTED':
    case 'EXPIRED': type = 'error'; break;
    default: type = 'info'; break;
  }
  WSS.direct(userId, { notification: { type, text: `Order #${order.orderId} was updated as ${order.status}` } });
}

async function processExecutionData(userId, monitorId, executionData, broadcastLabel) {

  if (executionData.x === 'NEW') return;

  const order = {
    symbol: executionData.s,
    orderId: executionData.i,
    clientOrderId: executionData.X === 'CANCELED' ? executionData.C : executionData.c,
    side: executionData.S,
    type: executionData.o,
    status: executionData.X,
    isMaker: executionData.m,
    transactTime: executionData.T
  }

  if (order.status === 'FILLED') {
    const quoteAmount = parseFloat(executionData.Z);
    order.avgPrice = quoteAmount / parseFloat(executionData.z);
    order.commission = executionData.n;
    const isQuoteCommission = executionData.N && order.symbol.endsWith(executionData.N);
    order.net = isQuoteCommission ? quoteAmount - parseFloat(order.commission) : quoteAmount;
  }

  if (order.status === 'REJECTED') order.obs = executionData.r;

  setTimeout(async () => {
    try {
      const updatedOrder = await ordersRepository.updateOrderByOrderId(order.orderId, order.clientOrderId, order)
      if (updatedOrder) {

        notifyOrderUpdate(userId, order);

        const orderCopy = getLightOrder(updatedOrder.get({ plain: true }));
        const results = await beholder.updateMemory(order.symbol, indexKeys.LAST_ORDER, null, orderCopy);
        if (results) results.map(r => WSS.direct(userId, { notification: r }));
        if (broadcastLabel && WSS)
          WSS.direct(userId, { [broadcastLabel]: orderCopy })
      }
    } catch (error) {
      logger(`M:${monitorId}-${userId}`, error);
    }

  }, 3000)
}

const EXCHANGES = {};

async function startUserDataMonitor(settings, user, monitorId, broadcastLabel, logs) {
  const [balanceBroadcast, executionBroadcast] = broadcastLabel ? broadcastLabel.split(',') : [null, null];

  await loadWallet(settings, user);

  const exchange = require('./utils/exchange')(settings, user);
  exchange.userDataStream(
    async balanceData => {
      if (logs) logger(`M:${monitorId}-${user.id}`, balanceData);
      const wallet = await loadWallet(settings, user);
      if (balanceBroadcast && WSS)
        WSS.direct(user.id, { [balanceBroadcast]: wallet })
    },
    executionData => {
      if (logs) logger(`M:${monitorId}-${user.id}`, executionData);

      processExecutionData(user.id, monitorId, executionData, executionBroadcast);
    }
  );
  EXCHANGES[user.id] = exchange;
  logger(`M:${monitorId}-${user.id}`, `User Data Monitor has started at ${broadcastLabel}`);
}

async function stopUserDataMonitor(user, monitorId, logs) {
  const exchange = EXCHANGES[user.id];
  if (!exchange) return;

  exchange.terminateUserDataStream();
  if (logs) logger(`M:${monitorId}-${user.id}`, `User Data Monitor ${monitorId}-${user.id} stopped!`);

  beholder.clearWallet(user.id);
}

async function processChartData(monitorId, symbol, indexes, interval, ohlc, logs) {
  if (typeof indexes === 'string') indexes = indexes.split(',');
  if (!indexes || !Array.isArray(indexes) || indexes.length === 0) return false;

  const memoryKeys = [];

  indexes.map(index => {
    const params = index.split('_');
    const indexName = params[0];
    params.splice(0, 1);

    try {
      const calc = execCalc(indexName, ohlc, ...params);
      if (logs) logger('M:' + monitorId, `${index}_${interval} calculated: ${JSON.stringify(calc.current ? calc.current : calc)}`);
      beholder.updateMemory(symbol, index, interval, calc, false);

      memoryKeys.push(beholder.parseMemoryKey(symbol, index, interval));
    } catch (err) {
      logger('M:' + monitorId, `Exchange Monitor => Can't calc the index ${index}:`);
      logger('M:' + monitorId, err);
    }
  });

  return Promise.all(memoryKeys.map(async (key) => {
    return beholder.testAutomations(key);
  }))
}

function startChartMonitor(userId, monitorId, symbol, interval, indexes, broadcastLabel, logs) {
  if (!symbol) return new Error(`You can't start a chart monitor without a symbol`);
  if (!anonymousExchange) return new Error(`Exchange Monitor not initializer yet.`);

  anonymousExchange.chartStream(symbol, interval || '1m', async (ohlc) => {

    const lastCandle = {
      open: ohlc.open[ohlc.open.length - 1],
      close: ohlc.close[ohlc.close.length - 1],
      high: ohlc.high[ohlc.high.length - 1],
      low: ohlc.low[ohlc.low.length - 1],
    }

    const previousCandle = {
      open: ohlc.open[ohlc.open.length - 2],
      close: ohlc.close[ohlc.close.length - 2],
      high: ohlc.high[ohlc.high.length - 2],
      low: ohlc.low[ohlc.low.length - 2],
      volume: ohlc.volume[ohlc.volume.length - 2],
    };

    const previousPreviousCandle = {
      open: ohlc.open[ohlc.open.length - 3],
      close: ohlc.close[ohlc.close.length - 3],
      high: ohlc.high[ohlc.high.length - 3],
      low: ohlc.low[ohlc.low.length - 3],
      volume: ohlc.volume[ohlc.volume.length - 3],
    };

    if (logs) logger('M:' + monitorId, lastCandle);

    try {
      beholder.updateMemory(symbol, indexKeys.LAST_CANDLE, interval, { current: lastCandle, previous: previousCandle }, false);
      beholder.updateMemory(symbol, indexKeys.PREVIOUS_CANDLE, interval, { current: previousCandle, previous: previousPreviousCandle }, false);

      if (broadcastLabel && WSS) sendMessage(userId, { [broadcastLabel]: lastCandle });

      let results = await processChartData(monitorId, symbol, indexes, interval, ohlc, logs);

      if (results && (Array.isArray(results) && results.length > 0 && results[0])) {
        if (logs)
          logger('M:' + monitorId, `chartStream Results: ${JSON.stringify(results)}`);
        results.flat().map(r => sendMessage(userId, { notification: r }));
      }
    } catch (err) {
      if (logs) logger('M:' + monitorId, err);
    }
  });
  logger('M:' + monitorId, `Chart Monitor has started at ${symbol}_${interval}`);
}

function stopChartMonitor(monitorId, symbol, interval, indexes, logs) {
  if (!symbol) return new Error(`You can't stop a chart monitor without a symbol`);
  if (!anonymousExchange) return new Error(`Exchange Monitor not initializer yet.`);

  anonymousExchange.terminateChartStream(symbol, interval);
  if (logs) logger('M:' + monitorId, `Chart Monitor ${symbol}_${interval} stopped!`);

  beholder.deleteMemory(symbol, indexKeys.LAST_CANDLE, interval);

  if (indexes && Array.isArray(indexes))
    indexes.map(ix => beholder.deleteMemory(symbol, ix, interval));
}

function getLightTicker(data) {
  delete data.eventType;
  delete data.eventTime;
  delete data.symbol;
  delete data.openTime;
  delete data.closeTime;
  delete data.firstTradeId;
  delete data.lastTradeId;
  delete data.numTrades;
  delete data.quoteVolume;
  delete data.closeQty;
  delete data.bestBidQty;
  delete data.bestAskQty;
  delete data.volume;

  data.priceChange = parseFloat(data.priceChange);
  data.percentChange = parseFloat(data.percentChange);
  data.averagePrice = parseFloat(data.averagePrice);
  data.prevClose = parseFloat(data.prevClose);
  data.high = parseFloat(data.high);
  data.low = parseFloat(data.low);
  data.open = parseFloat(data.open);
  data.close = parseFloat(data.close);
  data.bestBid = parseFloat(data.bestBid);
  data.bestAsk = parseFloat(data.bestAsk);

  return data;
}

function startTickerMonitor(userId, monitorId, symbol, broadcastLabel, logs) {
  if (!symbol) return new Error(`You can't start a ticker monitor without a symbol`);
  if (!anonymousExchange) return new Error(`Exchange Monitor not initializer yet.`);

  anonymousExchange.tickerStream(symbol, async (data) => {
    if (logs) logger('M:' + monitorId, data);

    try {
      const ticker = getLightTicker({ ...data });
      const currentMemory = beholder.getMemory(symbol, indexKeys.TICKER);

      const newMemory = {};
      newMemory.previous = currentMemory ? currentMemory.current : ticker;
      newMemory.current = ticker;

      await beholder.updateMemory(data.symbol, indexKeys.TICKER, null, newMemory);

      if (WSS && broadcastLabel) WSS.direct(userId, { [broadcastLabel]: data });
    } catch (err) {
      if (logs) logger('M:' + monitorId, err)
    }
  })

  logger('M:' + monitorId, `Ticker Monitor has started for ${symbol}`)
}


function stopTickerMonitor(monitorId, symbol, logs) {
  if (!symbol) return new Error(`You can't stop a ticker monitor without a symbol`);
  if (!anonymousExchange) return new Error(`Exchange Monitor not initializer yet.`);

  anonymousExchange.terminateTickerStream(symbol);
  if (logs) logger('M:' + monitorId, `Ticker Monitor ${symbol} stopped!`);

  beholder.deleteMemory(symbol, indexKeys.TICKER);
}

function sendMessage(userId, jsonObject) {
  try {
    if (jsonObject.notification)
      push.send(userId, jsonObject.notification.text, 'Beholder Notification', jsonObject.notification);
  } catch (err) {

  }

  return WSS.direct(userId, jsonObject);
}

function getConnections() {
  return WSS.getConnections();
}

async function init(settings, users, wssInstance, beholderInstance) {
  if (!settings || !beholderInstance) return new Error('Exchange Monitor not initialized yet.');

  WSS = wssInstance;
  beholder = beholderInstance;
  anonymousExchange = require('./utils/exchange')(settings);

  const monitors = await getActiveSystemMonitors();
  const miniTickerMonitor = monitors.find(m => m.type === monitorTypes.MINI_TICKER);

  if (miniTickerMonitor)
    startMiniTickerMonitor(miniTickerMonitor.id, miniTickerMonitor.broadcastLabel, miniTickerMonitor.logs);

  const userDataMonitor = monitors.find(m => m.type === monitorTypes.USER_DATA);

  if (users) {
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      setTimeout(async () => {

        if (!user.accessKey || !user.secretKey) return;
        if (userDataMonitor && userDataMonitor.isActive) user.monitors.push(userDataMonitor);

        user.monitors.filter(m => m.isActive).map(monitor => {
          setTimeout(() => {
            switch (monitor.type) {
              case monitorTypes.USER_DATA:
                return startUserDataMonitor(settings, user, monitor.id, monitor.broadcastLabel, monitor.logs);
              case monitorTypes.CANDLES:
                return startChartMonitor(user.id, monitor.id, monitor.symbol,
                  monitor.interval,
                  monitor.indexes.split(','),
                  monitor.broadcastLabel,
                  monitor.logs);
              case monitorTypes.TICKER:
                return startTickerMonitor(user.id, monitor.id, monitor.symbol, monitor.broadcastLabel, monitor.logs);
            }
          }, 250);
        })

        const lastOrders = await ordersRepository.getLastFilledOrders(user.id);
        await Promise.all(lastOrders.map(async (order) => {
          const orderCopy = getLightOrder(order.get({ plain: true }));
          await beholder.updateMemory(order.symbol, `${indexKeys.LAST_ORDER}_${user.id}`, null, orderCopy, false);
        }));
      }, i * (user.monitors.length + 1) * 250)
    }
  }

  logger('system', 'App Exchange Monitor is running');
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

module.exports = {
  init,
  startChartMonitor,
  stopChartMonitor,
  startTickerMonitor,
  stopTickerMonitor,
  sendMessage,
  loadWallet,
  getConnections,
  startUserDataMonitor,
  stopUserDataMonitor
}