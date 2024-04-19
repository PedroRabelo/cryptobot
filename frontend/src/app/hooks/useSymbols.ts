import { filterSymbolObjects } from '@/views/components/SelectQuote';
import { useQuery } from '@tanstack/react-query';
import { symbolsService } from '../services/symbolsService';

export function useSymbols(quote: string) {
  const { data, isFetching } = useQuery({
    queryKey: ['symbols'],
    queryFn: symbolsService.getSymbols,
  });

  const symbolsFiltered = data && filterSymbolObjects(data, quote);

  return { symbols: symbolsFiltered ?? [], isFetching };
}
