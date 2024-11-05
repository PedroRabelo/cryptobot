const Binance = require('node-binance-api');
const logger = require('./logger');

const LOGS = process.env.BINANCE_LOGS === 'true';
const SAPI_URL = process.env.BINANCE_SAPI_URL;

module.exports = (settings, user) => {
  if (!settings) throw new Error('The settings object is required to connect on exchange.');

  const binance = new Binance({
    APIKEY: user ? user.accessKey : undefined,
    APISECRET: user ? user.secretKey : undefined,
    recvWindow: 5000,
    family: 0,
    urls: {
      base: settings.apiUrl.endsWith('/') ? settings.apiUrl : settings.apiUrl + '/',
      stream: settings.streamUrl.endsWith('/') ? settings.streamUrl : settings.streamUrl + '/',
    }
  });

  binance.APIKEY = user ? user.accessKey : undefined;
  binance.APISECRET = user ? user.secretKey : undefined;

  function balance() {
    return binance.balance();
  }

  function exchangeInfo() {
    return binance.exchangeInfo();
  }

  function buy(symbol, quantity, price, options) {
    if (!options.type || options.type === 'MARKET')
      return binance.marketBuy(symbol, quantity);

    return binance.buy(symbol, quantity, price, options);
  }

  function sell(symbol, quantity, price, options) {
    if (!options.type || options.type === 'MARKET')
      return binance.marketSell(symbol, quantity);

    return binance.sell(symbol, quantity, price, options);
  }

  function cancel(symbol, orderId) {
    return binance.cancel(symbol, orderId);
  }

  function orderStatus(symbol, orderId) {
    return binance.orderStatus(symbol, orderId);
  }

  async function orderTrade(symbol, orderId) {
    const trades = await binance.trades(symbol);
    return await trades.find(t => t.orderId === parseInt(orderId));
  }

  function withdraw(coin, amount, address, network, addressTag) {
    try {
      const data = { coin, amount, address };
      if (addressTag) data.addressTag = addressTag;
      if (network) data.network = network;

      return privateCalls(SAPI_URL + 'capital/withdraw/apply', data, 'POST');
    } catch (err) {
      throw new Error(err.response ? JSON.stringify(err.response.data) : err.message);
    }
  }

  async function getCoins() {
    try {
      const coins = await privateCalls(SAPI_URL + 'capital/config/getall', null, 'GET');
      return coins.map(c => {
        return {
          coin: c.coin,
          networks: c.networkList.map(n => {
            return {
              network: n.network,
              withdrawIntegerMultiple: n.withdrawIntegerMultiple,
              isDefault: n.isDefault,
              name: n.name,
              withdrawFee: n.withdrawFee,
              withdrawMin: n.withdrawMin,
              minConfirm: n.minConfirm
            }
          })
        }
      })
    } catch (err) {
      throw new Error(err.response ? JSON.stringify(err.response.data) : err.message);
    }
  }

  async function publicCalls(apiUrl, data = {}, method = 'GET') {

    if (!binance.APIKEY) throw new Error('The settings object is required to connect on exchange.');

    const axios = require('axios');
    const queryString = new URLSearchParams();
    Object.entries(data).map(prop => queryString.append(prop[0], `${prop[1]}`));

    const result = await axios({
      method,
      url: `${apiUrl}?${queryString.toString()}`,
      headers: { 'X-MBX-APIKEY': binance.APIKEY }
    })

    return result.data;
  }

  async function privateCalls(apiUrl, data = {}, method = 'GET') {

    if (!binance.APIKEY || !binance.APISECRET) throw new Error('The settings object is required to connect on exchange.');

    const timestamp = Date.now();
    const recvWindow = 60000;

    const axios = require('axios');
    const queryString = new URLSearchParams();
    Object.entries({ ...data, timestamp, recvWindow }).map(prop => queryString.append(prop[0], `${prop[1]}`));

    const signature = require('crypto')
      .createHmac('sha256', binance.APISECRET)
      .update(queryString.toString())
      .digest('hex');

    queryString.append('signature', signature);

    const result = await axios({
      method,
      url: `${apiUrl}?${queryString.toString()}`,
      headers: { 'X-MBX-APIKEY': binance.APIKEY }
    })

    return result.data;
  }

  function miniTickerStream(callback) {
    binance.websockets.miniTicker(markets => callback(markets));
  }

  function bookStream(callback) {
    binance.websockets.bookTickers(order => callback(order));
  }

  function userDataStream(balanceCallback, executionCallback, listStatusCallback) {
    binance.websockets.userData(
      balance => balanceCallback(balance),
      executionData => executionCallback(executionData),
      subscribedData => {
        logger('system', `userDataStream:subscribed: ${subscribedData}`)
        binance.options.listenKey = subscribedData;
      },
      listStatusData => listStatusCallback(listStatusData)
    )
  }

  function terminateUserDataStream() {
    const url = settings.apiUrl.endsWith('/')
      ? settings.apiUrl + 'v3/userDataStream'
      : settings.apiUrl + '/v3/userDataStream';

    try {
      const data = { listenKey: binance.options.listenKey };
      return publicCalls(url, data, 'DELETE');
    } catch (err) {
      throw new Error(err.response ? JSON.stringify(err.response.data) : err.message);
    }
  }

  async function chartStream(symbol, interval, callback) {
    const binance = new Binance().options({ family: 0 });
    const streamUrl = binance.websockets.chart(symbol, interval, (symbol, interval, chart) => {
      const tick = binance.last(chart);
      if (tick && chart[tick] && chart[tick].isFinal === false)
        return;

      const ohlc = binance.ohlc(chart);
      callback(ohlc);
    });
    if (LOGS) logger('system', `Chart Stream connected at ${streamUrl}`);
  }

  function terminateChartStream(symbol, interval) {
    binance.websockets.terminate(`${symbol.toLowerCase()}@kline_${interval}`);
    logger('system', `Chart Stream ${symbol.toLowerCase()}@kline_${interval} terminated`);
  }

  async function tickerStream(symbol, callback) {
    const streamUrl = binance.websockets.prevDay(symbol, (data, converted) => {
      callback(converted)
    })
    if (LOGS) logger('system', `Ticker Stream connected at ${streamUrl}`);
  }

  function terminateTickerStream(symbol) {
    binance.websockets.terminate(`${symbol.toLowerCase()}@ticker`);
    logger('system', `Ticker Stream disconnected at ${symbol.toLowerCase()}@ticker`);
  }

  return {
    exchangeInfo,
    miniTickerStream,
    bookStream,
    userDataStream,
    balance,
    buy,
    sell,
    cancel,
    orderStatus,
    orderTrade,
    chartStream,
    terminateChartStream,
    tickerStream,
    terminateTickerStream,
    getCoins,
    withdraw,
    terminateUserDataStream
  }
}