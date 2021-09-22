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
    },
  });

  public exchangeInfo(): any {
    return this.binance.exchangeInfo();
  }

  public miniTickerStream(callback: any): void {
    this.binance.websockets.miniTicker(markets => callback(markets));
  }
}

export default Exchange;
