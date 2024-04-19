import { useSymbols } from "@/app/hooks/useSymbols";
import { symbolsService } from "@/app/services/symbolsService";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";

export function useSymbolsController() {
  const queryClient = useQueryClient()
  const { symbols, isFetching } = useSymbols()

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

  return {
    symbols,
    isLoading: isFetching,
    onSyncClick,
    isSyncing
  }
}