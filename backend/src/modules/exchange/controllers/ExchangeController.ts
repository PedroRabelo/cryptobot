import { Request, Response } from 'express';
import ShowSettingService from '@modules/settings/services/ShowSettingService';
import { decrypt } from '@shared/utils/crypto';
import Exchange from '@shared/utils/Exchange';

export default class ExchangeController {
  public async getBalance(
    request: Request,
    response: Response,
  ): Promise<Response> {
    const userId = request.user.id;

    const showSetting = new ShowSettingService();
    const setting = await showSetting.execute({ userId });
    if (setting) {
      setting.secretKey = decrypt(setting?.secretKey);
      const exchange = new Exchange(setting);
      const balance = await exchange.balance();
      return response.json(balance);
    }
    return response.sendStatus(400);
  }
}
