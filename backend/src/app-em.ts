import Setting from '@modules/settings/typeorm/entities/Setting';
import WebSocket from 'ws';
import { decrypt } from '@shared/utils/crypto';
import Exchange from '@shared/utils/Exchange';

function init(settings: Setting, wss: WebSocket.Server): void {
  if (!settings)
    throw new Error(`Can't start Exchange Monitor without settings.`);

  settings.secretKey = decrypt(settings.secretKey);

  const exchange = new Exchange(settings);
  exchange.miniTickerStream((markets: any) => {
    if (!wss || !wss.clients) return;

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ miniTicker: markets }));
      }
    });
  });

  console.log(`App Exchange Monitor is running`);
}

export default { init };
