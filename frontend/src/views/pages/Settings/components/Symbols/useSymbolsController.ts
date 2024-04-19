import { useSymbols } from "@/app/hooks/useSymbols";
import { symbolsService } from "@/app/services/symbolsService";
import { getDefaultQuote, setDefaultQuote } from "@/views/components/SelectQuote";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";

export function useSymbolsController() {
  const queryClient = useQueryClient()
  const [quote, setQuote] = useState(getDefaultQuote())

  const { symbols, isFetching } = useSymbols(quote!)

  const [isSyncing, setIsSyncing] = useState(false)

  async function onSyncClick() {
    try {
      setIsSyncing(true)

      await symbolsService.syncSymbols()

      setIsSyncing(false)
      queryClient.invalidateQueries({ queryKey: ['symbols'] })
    } catch (e) {
      toast.error('Ocorreu um erro ao tentar sincronizar os symbols')
      console.error(e);
      setIsSyncing(false)
    }
  }

  async function onQuoteChange(value: string) {
    setQuote(value)
    queryClient.invalidateQueries({ queryKey: ['symbols'] })
    setDefaultQuote(value)
  }

  return {
    symbols,
    isLoading: isFetching,
    onSyncClick,
    isSyncing,
    onQuoteChange
  }
}