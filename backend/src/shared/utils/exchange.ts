import Binance from 'node-binance-api';
import Setting from '@modules/settings/typeorm/entities/Setting';

class Exchange {
  constructor(private settings: Setting) {
    this.settings = settings;
  }

  binance = new Binance({
    APIKEY: this.settings.accessKey,
    APISECRET: this.settings.secretKey,
    urls: {
      base: this.settings.apiUrl.endsWith('/')
        ? this.settings.apiUrl
        : this.settings.apiUrl + '/',
      stream: this.settings.streamUrl.endsWith('/')
        ? this.settings.streamUrl
        : this.settings.streamUrl + '/',
    },
  });

  public balance(): any {
    return this.binance.balance();
  }

  public exchangeInfo(): any {
    return this.binance.exchangeInfo();
  }

  public miniTickerStream(callback: any): void {
    this.binance.websockets.miniTicker(markets => callback(markets));
  }

  public bookStream(callback: any): void {
    this.binance.websockets.bookTickers((order: any) => callback(order));
  }

  public userDataStream(
    balanceCallback: any,
    executionCallback: any,
    listStatusCallback: any,
  ): void {
    this.binance.websockets.userData(
      balance => balanceCallback(balance),
      executiondata => executionCallback(executiondata),
      subscribedData =>
        console.log(`userDataStream:subscribed: ${subscribedData}`),
      listStatusData => listStatusCallback(listStatusData),
    );
  }
}

export default Exchange;
