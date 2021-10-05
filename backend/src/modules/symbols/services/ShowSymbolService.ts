import { getCustomRepository } from 'typeorm';
import SymbolsRepository from '../typeorm/repositories/SymbolsRepository';
import Symbols from '@modules/symbols/typeorm/entities/Symbols';
import AppError from '@shared/errors/AppError';

interface IRequest {
  symbol: string;
}

class ShowSymbolService {
  public async execute({ symbol }: IRequest): Promise<Symbols> {
    const symbolsRepository = getCustomRepository(SymbolsRepository);

    const symbols = await symbolsRepository.findByName(symbol);

    if (!symbols) {
      throw new AppError('Símbolo não encontrado.');
    }

    return symbols;
  }
}

export default ShowSymbolService;
