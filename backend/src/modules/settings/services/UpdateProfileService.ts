import { getCustomRepository } from 'typeorm';
import AppError from '@shared/errors/AppError';
import Setting from '@modules/settings/typeorm/entities/Setting';
import SettingsRepository from '@modules/settings/typeorm/repositories/SettingsRepository';
import { encrypt } from '@shared/utils/crypto';

interface IRequest {
  userId: number;
  apiUrl: string;
  accessKey: string;
  secretKey: string;
}

class UpdateSettingsService {
  public async execute({
    userId,
    apiUrl,
    accessKey,
    secretKey,
  }: IRequest): Promise<Setting> {
    const settingRepository = getCustomRepository(SettingsRepository);

    const currentSetting = await settingRepository.findByUser(userId);

    if (!currentSetting) {
      throw new AppError('Configurações não encontradas.');
    }

    if (apiUrl !== currentSetting.apiUrl) currentSetting.apiUrl = apiUrl;

    if (apiUrl !== currentSetting.accessKey)
      currentSetting.accessKey = accessKey;

    if (secretKey) currentSetting.secretKey = encrypt(secretKey);

    await settingRepository.save(currentSetting);

    return currentSetting;
  }
}

export default UpdateSettingsService;
