const ordersRepository = require('./repositories/ordersRepository');
const { monitorTypes, getActiveSystemMonitors } = require('./repositories/monitorsRepository');
const { execCalc, indexKeys } = require('./utils/indexes');
const logger = require('./utils/logger');

let WSS, hydra, anonymousExchange;

let book = [];
function startBookMonitor(monitorId, broadcastLabel, logs) {
  if (!anonymousExchange) return new Error('Exchange Monitor not initialized yet.');
  anonymousExchange.bookStream(async (order) => {
    if (logs) logger('M:' + monitorId, order);

    try {
      if (book.length === 200) {
        if (broadcastLabel && WSS) WSS.broadcast({ [broadcastLabel]: book });
        book = [];
      }
      else book.push({ ...order });

      hydra.updateMemory(order.symbol, indexKeys.BOOK, null, order);
    } catch (err) {
      if (logs) logger('M:' + monitorId, err);
    }
  })
  logger('M:' + monitorId, 'Book Monitor has started!');
}

async function loadWallet(settings, user) {
  const exchange = require('./utils/exchange')(settings, user);
  if (!exchange) return new Error(`Exchange Monitor not initializer yet.`);

  const info = await exchange.balance();
  const wallet = Object.entries(info).map(async (item) => {
    const results = await hydra.updateMemory(item[0], `${indexKeys.WALLET}_${user.id}`, null, parseFloat(item[1].available));
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

        await hydra.updateMemory(order.symbol, `${indexKeys.LAST_ORDER}_${userId}`, null, updatedOrder.get({ plain: true }));

        if (broadcastLabel && WSS)
          WSS.direct(userId, { [broadcastLabel]: order })
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

  hydra.clearWallet(user.id);
}

async function processChartData(monitorId, symbol, indexes, interval, ohlc, logs) {
  if (typeof indexes === 'string') indexes = indexes.split(',');
  if (!indexes || !Array.isArray(indexes) || indexes.length === 0) return false;

  const memoryKeys = [];

  indexes.map(async index => {
    const params = index.split('_');
    const indexName = params[0];
    params.splice(0, 1);

    try {
      const calc = execCalc(indexName, ohlc, ...params);
      if (logs) logger('M:' + monitorId, `${index}_${interval} calculated: ${JSON.stringify(calc.current ? calc.current : calc)}`);
      await hydra.updateMemory(symbol, index, interval, calc, false);

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
      await hydra.updateMemory(symbol, indexKeys.LAST_CANDLE, interval, { current: lastCandle, previous: previousCandle }, false);
      await hydra.updateMemory(symbol, indexKeys.PREVIOUS_CANDLE, interval, { current: previousCandle, previous: previousPreviousCandle }, false);

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

  hydra.deleteMemory(symbol, indexKeys.LAST_CANDLE, interval);

  if (indexes && Array.isArray(indexes))
    indexes.map(ix => hydra.deleteMemory(symbol, ix, interval));
}

function startTickerMonitor(userId, monitorId, symbol, broadcastLabel, logs) {
  if (!symbol) return new Error(`You can't start a ticker monitor without a symbol`);
  if (!anonymousExchange) return new Error(`Exchange Monitor not initializer yet.`);

  anonymousExchange.tickerStream(symbol, async (data) => {
    if (logs) logger('M:' + monitorId, data);

    try {
      const results = await hydra.updateMemory(data.symbol, indexKeys.TICKER, null, data);
      if (results) results.map(r => WSS.direct(userId, { notification: r }));

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

  hydra.deleteMemory(symbol, indexKeys.TICKER);
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

async function init(settings, users, wssInstance, hydraInstance) {
  if (!settings || !hydraInstance) return new Error('Exchange Monitor not initialized yet.');

  WSS = wssInstance;
  hydra = hydraInstance;
  anonymousExchange = require('./utils/exchange')(settings);

  const monitors = await getActiveSystemMonitors();

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
          await hydra.updateMemory(order.symbol, `${indexKeys.LAST_ORDER}_${user.id}`, null, order, false);
        }));
      }, i * (user.monitors.length + 1) * 250)
    }
  }

  logger('system', 'App Exchange Monitor is running');
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