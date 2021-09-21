import { getCustomRepository } from 'typeorm';
import Symbols from '@modules/symbols/typeorm/entities/Symbols';
import SymbolsRepository from '@modules/symbols/typeorm/repositories/SymbolsRepository';

class ListSymbolService {
  public async execute(): Promise<Symbols[]> {
    const symbolsRepository = getCustomRepository(SymbolsRepository);

    return await symbolsRepository.find();
  }
}

export default ListSymbolService;
