import { getCustomRepository } from 'typeorm';
import UsersRepository from '@modules/users/typeorm/repositories/UsersRepository';
import User from '@modules/users/typeorm/entities/User';

class ListUserService {
  public async execute(): Promise<User[]> {
    const usersRepository = getCustomRepository(UsersRepository);

    return await usersRepository.find();
  }
}

export default ListUserService;
