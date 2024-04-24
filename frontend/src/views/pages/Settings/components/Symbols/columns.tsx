import { ISymbol } from "@/app/entities/Symbols"
import { cn } from "@/app/lib/utils"
import { Button } from "@/views/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { Pencil, StarIcon } from "lucide-react"

export const columns: ColumnDef<ISymbol>[] = [
  {
    accessorKey: "symbol",
    header: "Symbol",
    cell: ({ row }) => {
      const symbol = row.original

      return (
        <div className="flex items-center gap-2">
          <StarIcon
            className={cn(symbol.isFavorite && 'fill-yellow-400', 'text-yellow-400')}
          />
          <span>{symbol.symbol}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "basePrecision",
    header: "Base Precision",
  },
  {
    accessorKey: "quotePrecision",
    header: "Quote Precision",
  },
  {
    accessorKey: "minNotional",
    header: "Min. Notional",
  },
  {
    accessorKey: "minLotSize",
    header: "Min. Lot Size",
  },
  {
    accessorKey: "Actions",
    cell: () => {
      return (
        <Button>
          <Pencil className="h-5 w-5 mr-2" />
          Editar
        </Button>
      )
    }
  },
]