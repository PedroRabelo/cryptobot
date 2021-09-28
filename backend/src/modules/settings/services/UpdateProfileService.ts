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
  streamUrl: string;
}

class UpdateSettingsService {
  public async execute({
    userId,
    apiUrl,
    accessKey,
    secretKey,
    streamUrl,
  }: IRequest): Promise<Setting> {
    const settingRepository = getCustomRepository(SettingsRepository);

    const currentSetting = await settingRepository.findByUser(userId);

    if (!currentSetting) {
      throw new AppError('Configurações não encontradas.');
    }

    if (apiUrl !== currentSetting.apiUrl) currentSetting.apiUrl = apiUrl;

    if (accessKey !== currentSetting.accessKey)
      currentSetting.accessKey = accessKey;

    if (secretKey) currentSetting.secretKey = encrypt(secretKey);

    if (streamUrl !== currentSetting.streamUrl)
      currentSetting.streamUrl = streamUrl;

    await settingRepository.save(currentSetting);

    return currentSetting;
  }
}

export default UpdateSettingsService;
