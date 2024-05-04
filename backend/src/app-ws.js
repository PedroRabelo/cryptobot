const WebSocket = require('ws');

function onMessage(data) {
  console.log(`onMessage: ${data}`);
}

function onError(err) {
  console.error(`onError: ${err.message}`);
}

function onConnection(ws, req) {
  ws.on('message', onMessage);
  ws.on('error', onError);
  console.log(`onConnection`);
}

module.exports = (server) => {
  const wss = new WebSocket.Server({
    server
  });

  wss.on('connection', onConnection);
  wss.on('error', () => console.log('erro'));
  console.log('App Web Socket is running!');

  return wss;
}