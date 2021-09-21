import Symbols from '@modules/symbols/typeorm/entities/Symbols';
import SymbolsRepository from '@modules/symbols/typeorm/repositories/SymbolsRepository';
import { getCustomRepository } from 'typeorm';
import AppError from '@shared/errors/AppError';

interface IRequest {
  id: string;
  symbol: string;
  basePrecision: number;
  quotePrecision: number;
  minNotional: number;
  minLotSize: number;
  isFavorite: boolean;
}

class UpdateSymbolService {
  public async execute({
    id,
    symbol,
    basePrecision,
    quotePrecision,
    minNotional,
    minLotSize,
    isFavorite,
  }: IRequest): Promise<Symbols> {
    const symbolsRepository = getCustomRepository(SymbolsRepository);

    const currentSymbol = await symbolsRepository.findOne(id);

    if (!currentSymbol) {
      throw new AppError('Símbolo não encontrado.');
    }

    const symbolExists = await symbolsRepository.findByName(symbol);

    if (symbolExists) {
      throw new AppError('Já existe um símbolo com esta descrição');
    }

    if (basePrecision && basePrecision !== currentSymbol.basePrecision)
      currentSymbol.basePrecision = basePrecision;

    if (quotePrecision && quotePrecision !== currentSymbol.quotePrecision)
      currentSymbol.quotePrecision = quotePrecision;

    if (minNotional && minNotional !== currentSymbol.minNotional)
      currentSymbol.minNotional = minNotional;

    if (minLotSize && minLotSize !== currentSymbol.minLotSize)
      currentSymbol.minLotSize = minLotSize;

    if (
      isFavorite !== null &&
      isFavorite !== undefined &&
      isFavorite !== currentSymbol.isFavorite
    )
      currentSymbol.isFavorite = isFavorite;

    await symbolsRepository.save(currentSymbol);

    return currentSymbol;
  }
}

export default UpdateSymbolService;
