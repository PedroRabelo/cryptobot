import { useSymbols } from "@/app/hooks/useSymbols";

export function useSymbolsController() {
  const { symbols, isFetching } = useSymbols()

  return {
    symbols,
    isLoading: isFetching
  }
}