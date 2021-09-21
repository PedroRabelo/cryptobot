import { Request, Response } from 'express';
import CreateSettingService from '@modules/settings/services/CreateSettingService';
import ShowSettingService from '@modules/settings/services/ShowSettingService';
import UpdateSettingsService from '@modules/settings/services/UpdateProfileService';

export default class SettingsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const showSetting = new ShowSettingService();
    const userId = request.user.id;

    const setting = await showSetting.execute({ userId });

    return response.json(setting);
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const userId = request.user.id;
    const { apiUrl, accessKey, secretKey } = request.body;

    const createSetting = new CreateSettingService();

    const setting = await createSetting.execute({
      userId,
      apiUrl,
      accessKey,
      secretKey,
    });

    return response.json(setting);
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const userId = request.user.id;
    const { apiUrl, accessKey, secretKey } = request.body;

    const updateSetting = new UpdateSettingsService();

    const newSetting = await updateSetting.execute({
      userId,
      apiUrl,
      accessKey,
      secretKey,
    });

    return response.json(newSetting);
  }
}
