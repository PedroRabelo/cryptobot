import { getCustomRepository } from 'typeorm';
import UsersRepository from '@modules/users/typeorm/repositories/UsersRepository';
import UserTokensRepository from '@modules/users/typeorm/repositories/UserTokensRepository';
import AppError from '@shared/errors/AppError';
import { addHours, isAfter } from 'date-fns';
import { hash } from 'bcryptjs';

interface IRequest {
  token: string;
  password: string;
}

class ResetPasswordService {
  public async execute({ token, password }: IRequest): Promise<void> {
    const usersRepository = getCustomRepository(UsersRepository);
    const userTokensRepository = getCustomRepository(UserTokensRepository);

    const userToken = await userTokensRepository.findByToken(token);

    if (!userToken) {
      throw new AppError('Token não encontrado');
    }

    const user = await usersRepository.findById(userToken.user_id);

    if (!user) {
      throw new AppError('Usuário não encontrado');
    }

    const tokenCreatedAt = userToken.created_at;
    const compareDate = addHours(tokenCreatedAt, 2);

    if (isAfter(Date.now(), compareDate)) {
      throw new AppError('Token expirado');
    }

    user.password = await hash(password, 8);
    await usersRepository.save(user);
  }
}

export default ResetPasswordService;
