import { getCustomRepository } from 'typeorm';
import SymbolsRepository from '../typeorm/repositories/SymbolsRepository';
import Symbols from '@modules/symbols/typeorm/entities/Symbols';
import AppError from '@shared/errors/AppError';

interface IRequest {
  id: string;
}

class ShowSymbolService {
  public async execute({ id }: IRequest): Promise<Symbols> {
    const symbolsRepository = getCustomRepository(SymbolsRepository);

    const symbol = await symbolsRepository.findOne(id);

    if (!symbol) {
      throw new AppError('Símbolo não encontrado.');
    }

    return symbol;
  }
}

export default ShowSymbolService;
