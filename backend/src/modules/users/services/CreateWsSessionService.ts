import { getCustomRepository } from 'typeorm';
import SettingsRepository from '@modules/settings/typeorm/repositories/SettingsRepository';
import appWs from '../../../app-ws';
import { server } from '@shared/http/server';
import appEm from '../../../app-em';
import Setting from '@modules/settings/typeorm/entities/Setting';

interface IRequest {
  userId: number;
}

class CreateWsSessionService {
  public async execute({ userId }: IRequest) {
    const settingsRepository = getCustomRepository(SettingsRepository);
    await settingsRepository
      .findByUser(userId)
      .then(settings => {
        const wss = appWs.init(server);

        appEm.init(settings as Setting, wss);
      })
      .catch(err => {
        console.error(err);
      });
  }
}

export default CreateWsSessionService;
