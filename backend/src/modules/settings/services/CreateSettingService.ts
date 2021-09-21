import { getCustomRepository } from 'typeorm';
import AppError from '@shared/errors/AppError';
import Setting from '@modules/settings/typeorm/entities/Setting';
import SettingsRepository from '@modules/settings/typeorm/repositories/SettingsRepository';
import UsersRepository from '@modules/users/typeorm/repositories/UsersRepository';
import { encrypt } from '@shared/utils/crypto';

interface IRequest {
  userId: number;
  apiUrl: string;
  accessKey: string;
  secretKey: string;
}

class CreateSettingService {
  public async execute({
    userId,
    apiUrl,
    accessKey,
    secretKey,
  }: IRequest): Promise<Setting> {
    const settingsRepository = getCustomRepository(SettingsRepository);
    const usersRepository = getCustomRepository(UsersRepository);

    const userExists = await settingsRepository.findByUser(userId);
    if (userExists) {
      throw new AppError('Já existe uma settings para o usuário informado');
    }

    const user = await usersRepository.findById(userId);

    const setting = settingsRepository.create({
      user,
      apiUrl,
      accessKey,
      secretKey: encrypt(secretKey),
    });

    await settingsRepository.save(setting);

    return setting;
  }
}

export default CreateSettingService;
