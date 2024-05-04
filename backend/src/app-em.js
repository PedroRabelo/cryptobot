const WebSocket = require('ws');

module.exports = (settings, wss) => {

  if (!settings) return new Error('Exchange Monitor not initialized yet.');

  const exchange = require('./utils/exchange')(settings);

  function broadcast(jsonObject) {
    if (!wss || !wss.clients) return;
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(jsonObject));
      }
    });
  }

  exchange.miniTickerStream((markets) => {
    broadcast({ miniTicker: markets });

    const books = Object.entries(markets).map(mkt => {
      return { symbol: mkt[0], bestAsk: mkt[1].close, bestBid: mkt[1].close }
    })
    broadcast({ books: books })
  });

  exchange.userDataStream(balanceData => {
    broadcast({ balance: balanceData })
  },
    executionData => { console.log(executionData) }
  )

  console.log('App Exchange Monitor is running');
}