const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const authController = require('./controllers/authController');
const logger = require('./utils/logger');

function onMessage(data) {
  logger('system', `app-ws.onMessage: ${data}`);
}

function onError(err) {
  logger('system', `app-ws.onError: ${err.message}`);
}

function onConnection(ws, req) {
  ws.on('message', onMessage);
  ws.on('error', onError);
  logger('system', `app-ws.onConnection`);
}

function corsValidation(origin) {
  return process.env.CORS_ORIGIN.startsWith(origin);
}

function verifyClient(info, callback) {
  logger('system', process.env.CORS_ORIGIN.startsWith(info.origin))

  if (!corsValidation(info.origin)) return callback(false, 401);

  const token = info.req.url.split('token=')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && !authController.isBlacklisted(token)) {
        return callback(true)
      }
    } catch (err) {
      logger('system', token, err)
    }
  }

  return callback(false, 401);
}

function broadcast(jsonObject) {
  if (!this.clients) return;
  this.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(jsonObject));
    }
  });
}

module.exports = (server) => {
  const wss = new WebSocket.Server({
    server,
    verifyClient
  });

  wss.on('connection', onConnection);
  wss.broadcast = broadcast;
  logger('system', 'App Web Socket is running!');

  return wss;
}