import { ISymbol } from '@/app/entities/Symbols';
import { httpClient } from '../httpClient';

export interface ISymbolParams {
  isFavorite: boolean;
  basePrecision: number;
  quotePrecision: number;
  minNotional: string;
  minLotSize: string;
}

export async function updateSymbol(symbol: string, params: ISymbolParams) {
  const { data } = await httpClient.patch<ISymbol>(
    `/symbols/${symbol}`,
    params,
  );

  return data;
}
