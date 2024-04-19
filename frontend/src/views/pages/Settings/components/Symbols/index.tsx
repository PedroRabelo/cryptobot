import { SelectQuote } from "@/views/components/SelectQuote"
import { Spinner } from "@/views/components/Spinner"
import { Button } from "@/views/components/ui/button"
import { RefreshCwIcon } from "lucide-react"
import { columns } from "./columns"
import { DataTable } from "./dataTable"
import { useSymbolsController } from "./useSymbolsController"

export function Symbols() {
  const { symbols, isLoading, onSyncClick, isSyncing, onQuoteChange } = useSymbolsController()

  return (
    <div>
      {isLoading && <span>Carregando...</span>}
      <div className="flex justify-between mx-auto w-full gap-2 py-4">
        <h1 className="text-3xl font-semibold">Symbols</h1>
        <SelectQuote
          onChange={(value) => onQuoteChange(value)}
        />
      </div>

      <div className="container mx-auto py-2">
        <DataTable columns={columns} data={symbols} />
        <Button className="mt-4" onClick={() => onSyncClick()}>
          {isSyncing ? <Spinner className="h-6 w-6" /> : <RefreshCwIcon />}
          {isSyncing ? 'Syncing...' : 'Sync'}
        </Button>
      </div>
    </div>
  )
}