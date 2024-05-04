import { useSymbols } from "@/app/hooks/useSymbols";
import { filterSymbolNames, getDefaultQuote } from "@/views/components/SelectQuote";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useBookTickerController() {

  const [symbols, setSymbols] = useState<string[]>()
  const [quote, setQuote] = useState(getDefaultQuote())

  const queryClient = useQueryClient()
  const { symbols: symbolList } = useSymbols(quote!)

  useEffect(() => {
    setSymbols(filterSymbolNames(symbolList, quote!))
  }, [quote])

  function onQuoteChange(value: string) {
    queryClient.invalidateQueries({ queryKey: ['symbols'] })
    setQuote(value)
  }

  return {
    symbols,
    onQuoteChange
  }

}