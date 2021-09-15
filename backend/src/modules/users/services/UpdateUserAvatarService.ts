import { getCustomRepository } from 'typeorm';
import path from 'path';
import AppError from '@shared/errors/AppError';
import User from '@modules/users/typeorm/entities/User';
import UsersRepository from '@modules/users/typeorm/repositories/UsersRepository';
import uploadConfig from '@config/upload';
import * as fs from 'fs';

interface IRequest {
  user_id: number;
  avatarFilename: string | undefined;
}

class UpdateUserAvatarService {
  public async execute({ user_id, avatarFilename }: IRequest): Promise<User> {
    const usersRepository = getCustomRepository(UsersRepository);

    const user = await usersRepository.findById(user_id);

    if (!user) {
      throw new AppError('Usuário não encontrado');
    }

    if (user.avatar) {
      const userAvatarFilePath = path.join(uploadConfig.directory, user.avatar);
      const userAvatarFileExists = await fs.promises.stat(userAvatarFilePath);

      if (userAvatarFileExists) {
        await fs.promises.unlink(userAvatarFilePath);
      }
    }

    user.avatar = avatarFilename as string;

    await usersRepository.save(user);

    return user;
  }
}

export default UpdateUserAvatarService;
