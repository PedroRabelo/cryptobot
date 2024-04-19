import { ISymbol } from '@/app/entities/Symbols';
import { httpClient } from '../httpClient';

type SymbolResponse = ISymbol;

export async function getSymbols() {
  const { data } = await httpClient.get<SymbolResponse[]>('/symbols');

  return data
}
