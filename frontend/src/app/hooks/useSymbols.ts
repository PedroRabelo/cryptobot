import { useQuery } from '@tanstack/react-query';
import { symbolsService } from '../services/symbolsService';

export function useSymbols() {
  const { data, isFetching } = useQuery({
    queryKey: ['symbols'],
    queryFn: symbolsService.getSymbols,
  });

  return { symbols: data ?? [], isFetching };
}
