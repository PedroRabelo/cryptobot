import { getCustomRepository } from 'typeorm';
import SettingsRepository from '@modules/settings/typeorm/repositories/SettingsRepository';
import Setting from '@modules/settings/typeorm/entities/Setting';

interface IRequest {
  userId: number;
}

class ShowSettingService {
  public async execute({ userId }: IRequest): Promise<Setting | undefined> {
    const settingsRepository = getCustomRepository(SettingsRepository);

    const setting = await settingsRepository.findByUser(userId);

    return setting;
  }
}

export default ShowSettingService;
