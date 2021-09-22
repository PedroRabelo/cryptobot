import WebSocket from 'ws';
import { Server as HTTPServer } from 'http';
import { Server as HTTPSServer } from 'https';
import { Request } from 'express';

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

function init(server: HTTPServer | HTTPSServer | undefined) {
  const wss = new WebSocket.Server({
    server,
  });

  wss.on('connection', onConnection);
  console.log('App Web Socket Server is running!');
  return wss;
}

export default { init };
