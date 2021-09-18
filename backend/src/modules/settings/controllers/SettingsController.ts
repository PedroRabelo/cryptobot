import { Request, Response } from 'express';
import ListUserService from '@modules/users/services/ListUserService';

export default class SettingsController {
  public async index(request: Request, response: Response): Promise<Response> {
    return response.json('settings');
  }
}
