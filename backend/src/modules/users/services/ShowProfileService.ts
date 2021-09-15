import { getCustomRepository } from 'typeorm';
import UsersRepository from '@modules/users/typeorm/repositories/UsersRepository';
import User from '@modules/users/typeorm/entities/User';
import AppError from '@shared/errors/AppError';

interface IRequest {
  user_id: number;
}

class ShowProfileService {
  public async execute({ user_id }: IRequest): Promise<User> {
    const usersRepository = getCustomRepository(UsersRepository);

    const user = await usersRepository.findById(user_id);

    if (!user) {
      throw new AppError('Usuário não encontrado.');
    }

    return user;
  }
}

export default ShowProfileService;
