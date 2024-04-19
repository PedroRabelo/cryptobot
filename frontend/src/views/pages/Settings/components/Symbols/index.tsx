import { columns } from "./columns"
import { DataTable } from "./dataTable"
import { useSymbolsController } from "./useSymbolsController"

export function Symbols() {
  const { symbols, isLoading } = useSymbolsController()

  return (
    <div>
      {isLoading && <span>Carregando...</span>}

      <div className="container mx-auto py-2">
        <DataTable columns={columns} data={symbols} />
      </div>
    </div>
  )
}