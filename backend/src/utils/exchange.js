const Binance = require('node-binance-api');
const LOGS = process.env.BINANCE_LOGS === 'true';
const SAPI_URL = process.env.BINANCE_SAPI_URL;

module.exports = (settings) => {
  if (!settings) throw new Error('The settings object is required to connect on exchange.');

  const binance = new Binance({
    APIKEY: settings.accessKey,
    APISECRET: settings.secretKey,
    recvWindow: 5000,
    family: 0,
    urls: {
      base: settings.apiUrl.endsWith('/') ? settings.apiUrl : settings.apiUrl + '/',
      stream: settings.streamUrl.endsWith('/') ? settings.streamUrl : settings.streamUrl + '/',
    }
  })

  function balance() {
    return binance.balance();
  }

  function exchangeInfo() {
    return binance.exchangeInfo();
  }

  function buy(symbol, quantity, price, options) {
    if (price)
      return binance.buy(symbol, quantity, price, options);

    return binance.marketBuy(symbol, quantity);
  }

  function sell(symbol, quantity, price, options) {
    if (price)
      return binance.sell(symbol, quantity, price, options);

    return binance.marketSell(symbol, quantity);
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

  async function privateCalls(apiUrl, data = {}, method = 'GET') {
    const timestamp = Date.now();
    const recvWindow = 60000;

    const axios = require('axios');
    const queryString = new URLSearchParams();
    Object.entries({ ...data, timestamp, recvWindow }).map(prop => queryString.append(prop[0], `${prop[1]}`));

    const signature = require('crypto')
      .createHmac('sha256', settings.secretKey)
      .update(queryString.toString())
      .digest('hex');

    queryString.append('signature', signature);

    const result = await axios({
      method,
      url: `${apiUrl}?${queryString.toString()}`,
      headers: { 'X-MBX-APIKEY': settings.accessKey }
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
      subscribedData => console.log(`userDataStream:subscribed: ${subscribedData}`),
      listStatusData => listStatusCallback(listStatusData)
    )
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
    if (LOGS) console.log(`Chart Stream connected at ${streamUrl}`);
  }

  function terminateChartStream(symbol, interval) {
    binance.websockets.terminate(`${symbol.toLowerCase()}@kline_${interval}`);
    console.log(`Chart Stream ${symbol.toLowerCase()}@kline_${interval} terminated`);
  }

  async function tickerStream(symbol, callback) {
    const streamUrl = binance.websockets.prevDay(symbol, (data, converted) => {
      callback(converted)
    })
    if (LOGS) console.log(`Ticker Stream connected at ${streamUrl}`);
  }

  function terminateTickerStream(symbol) {
    binance.websockets.terminate(`${symbol.toLowerCase()}@ticker`);
    console.log(`Ticker Stream disconnected at ${symbol.toLowerCase()}@ticker`);
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
    getCoins
  }
}