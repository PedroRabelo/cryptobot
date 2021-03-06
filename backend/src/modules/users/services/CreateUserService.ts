import { getCustomRepository } from 'typeorm';
import AppError from '@shared/errors/AppError';
import User from '@modules/users/typeorm/entities/User';
import UsersRepository from '@modules/users/typeorm/repositories/UsersRepository';
import { hash } from 'bcryptjs';

interface IRequest {
  name: string;
  email: string;
  password: string;
}

class CreateUserService {
  public async execute({ name, email, password }: IRequest): Promise<User> {
    const usersRepository = getCustomRepository(UsersRepository);

    const emailExists = await usersRepository.findByEmail(email);
    if (emailExists) {
      throw new AppError('E-mail infomado já está sendo utilizado');
    }

    const hashedPassword = await hash(password, 8);

    const user = usersRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    await usersRepository.save(user);

    return user;
  }
}

export default CreateUserService;
