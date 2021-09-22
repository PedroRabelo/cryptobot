import { getCustomRepository } from 'typeorm';
import SettingsRepository from '@modules/settings/typeorm/repositories/SettingsRepository';
import Exchange from '../../../shared/utils/Exchange';
import Setting from '@modules/settings/typeorm/entities/Setting';
import { decrypt } from '@shared/utils/crypto';
import AppError from '@shared/errors/AppError';
import SymbolsRepository from '@modules/symbols/typeorm/repositories/SymbolsRepository';

interface IRequest {
  userId: number;
}

class SyncSymbolsService {
  public async execute({ userId }: IRequest): Promise<void> {
    const symbolsRepository = getCustomRepository(SymbolsRepository);
    const settingsRepository = getCustomRepository(SettingsRepository);
    const settings = await settingsRepository.findByUser(userId);

    const favoritesSymbols = (await symbolsRepository.find())
      .filter(s => s.isFavorite)
      .map(s => s.symbol);

    if (settings) {
      settings.secretKey = decrypt(settings?.secretKey);
      const exchange = new Exchange(settings as Setting);
      const info = await exchange.exchangeInfo();

      const symbolsSynced = info.symbols.map(
        (item: {
          filters: any[];
          symbol: any;
          baseAssetPrecision: any;
          quoteAssetPrecision: any;
          baseAsset: any;
          quoteAsset: any;
        }) => {
          const minNotionalFilter = item.filters.find(
            f => f.filterType === 'MIN_NOTIONAL',
          );
          const minLotSizeFilter = item.filters.find(
            f => f.filterType === 'LOT_SIZE',
          );

          return {
            symbol: item.symbol,
            basePrecision: item.baseAssetPrecision,
            quotePrecision: item.quoteAssetPrecision,
            base: item.baseAsset,
            quote: item.quoteAsset,
            minNotional: minNotionalFilter
              ? minNotionalFilter.minNotional
              : '1',
            minLotSize: minLotSizeFilter ? minLotSizeFilter.minQty : '1',
            isFavorite: favoritesSymbols.some(s => s === item.symbol),
          };
        },
      );

      await symbolsRepository.deleteAll();
      await symbolsRepository.bulkInsert(symbolsSynced);
    } else {
      throw new AppError(
        'Nenhuma configuração foi encontrada para o usuário logado',
      );
    }
  }
}

export default SyncSymbolsService;
