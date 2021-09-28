import Setting from '@modules/settings/typeorm/entities/Setting';
import WebSocket from 'ws';
import { decrypt } from '@shared/utils/crypto';
import Exchange from '@shared/utils/Exchange';

function init(settings: Setting, wss: WebSocket.Server): void {
  if (!settings)
    throw new Error(`Can't start Exchange Monitor without settings.`);

  settings.secretKey = decrypt(settings.secretKey);
  const exchange = new Exchange(settings);

  function broadcast(jsonObject: any) {
    if (!wss || !wss.clients) return;

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(jsonObject));
      }
    });
  }

  exchange.miniTickerStream((markets: any) => {
    broadcast({ miniTicker: markets });
  });

  let book: any = [];
  exchange.bookStream((order: any) => {
    if (book.length === 300) {
      broadcast({ book });
      book = [];
    } else {
      book.push(order);
    }
  });

  exchange.userDataStream(
    (balanceData: any) => {
      broadcast({ balance: balanceData });
    },
    (executionData: any) => {
      console.log(executionData);
    },
    (listStatusData: any) => console.log(listStatusData),
  );

  console.log(`App Exchange Monitor is running`);
}

export default { init };
