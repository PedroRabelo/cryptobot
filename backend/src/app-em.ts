import Setting from '@modules/settings/typeorm/entities/Setting';
import WebSocket from 'ws';
import { decrypt } from '@shared/utils/crypto';
import Exchange from '@shared/utils/Exchange';
import Order from '@modules/order/typeorm/entities/Order';
import UpdateOrderService from '@modules/order/services/UpdateOrderService';

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

  function processExecutionData(executionData: any) {
    if (executionData.x === 'NEW') return;

    const order: Order = {
      symbol: executionData.s,
      orderId: executionData.i,
      clientOrderId:
        executionData.X === 'CANCELED' ? executionData.C : executionData.c,
      side: executionData.S,
      type: executionData.o,
      status: executionData.X,
      isMaker: executionData.m,
      transactTime: executionData.T,
      avgPrice: 0,
      commission: '',
      net: 0,
    };

    if (order.status === 'FILLED') {
      const quoteAmount = parseFloat(executionData.Z);
      order.avgPrice = quoteAmount / parseFloat(executionData.z);
      order.commission = executionData.n;
      const isQuoteComission =
        executionData.N && order.symbol.endsWith(executionData.N);
      order.net = isQuoteComission
        ? quoteAmount - parseFloat(order.commission)
        : quoteAmount;
    }

    if (order.status === 'REJECTED') order.obs = executionData.r;

    setTimeout(() => {
      const updateOrder = new UpdateOrderService();
      updateOrder
        .updateByOrderId({
          orderId: order.orderId,
          clientOrderId: order.clientOrderId,
          newOrder: order,
        })
        .then(order => order && broadcast({ execution: order }))
        .catch(err => console.error(err));
    }, 3000);
  }

  exchange.userDataStream(
    (balanceData: any) => {
      broadcast({ balance: balanceData });
    },
    (executionData: any) => processExecutionData(executionData),
    null,
  );

  console.log(`App Exchange Monitor is running`);
}

export default { init };
