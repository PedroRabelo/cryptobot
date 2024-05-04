const WebSocket = require('ws');

module.exports = (settings, wss) => {

  if (!settings) return new Error('Exchange Monitor not initialized yet.');

  const exchange = require('./utils/exchange')(settings);

  exchange.miniTickerStream((markets) => {
    // console.log(!wss.clients);
    if (!wss || !wss.clients) return;
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ miniTicker: markets }));
      }
    });
  });

  console.log('App Exchange Monitor is running');
}