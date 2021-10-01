import WebSocket from 'ws';
import { Server as HTTPServer } from 'http';
import { Server as HTTPSServer } from 'https';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import isAuthenticated, {
  isBlacklisted,
} from '@shared/http/middlewares/isAuthenticated';

function onMessage(data: any) {
  console.log(`onMessage ${data}`);
}

function onError(err: any) {
  console.error(`onError: ${err.message}`);
}

function onConnection(ws: WebSocket.Server, req: Request) {
  ws.on('message', onMessage);
  ws.on('error', onError);
  console.log(`onConnection`);
}

function corsValidation(origin: string) {
  return process.env.CORS_ORIGIN?.startsWith(origin);
}

function verifyClient(info: any, callback: any) {
  if (!corsValidation(info.origin)) return callback(false, 401);

  const token = info.req.url.split('token=')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      if (decoded && !isBlacklisted(token)) {
        return callback(true);
      }
    } catch (err) {
      console.error(token, err);
    }
  }

  return callback(false, 401);
}

function init(server: HTTPServer | HTTPSServer | undefined) {
  const wss = new WebSocket.Server({
    server,
    verifyClient,
  });

  wss.on('connection', onConnection);
  console.log('App Web Socket Server is running!');
  return wss;
}

export default { init };
