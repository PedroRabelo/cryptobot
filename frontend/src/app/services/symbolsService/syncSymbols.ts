import { ISymbol } from '@/app/entities/Symbols';
import { httpClient } from '../httpClient';

type SymbolResponse = ISymbol;

export async function syncSymbols() {
  await httpClient.post<SymbolResponse[]>('/symbols/sync');
}
