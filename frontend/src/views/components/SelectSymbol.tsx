import { cn } from "@/app/lib/utils";
import { symbolsService } from "@/app/services/symbolsService";
import { Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface IProps {
  symbol?: string;
  onChange(target: {
    id: string;
    value: string;
  }): void;
  showOnlyFavorites?: boolean;
  disabled?: boolean;
}

export function SelectSymbol({ symbol, onChange, showOnlyFavorites, disabled = false }: IProps) {
  const [symbols, setSymbols] = useState(["LOADING"])
  const [onlyFavorites, setOnlyFavorites] = useState(showOnlyFavorites === null || showOnlyFavorites === undefined ? true : showOnlyFavorites)

  const fetchSymbols = useCallback(async () => {
    const data = await symbolsService.getSymbols()
    console.log(onlyFavorites)
    const symbolNames = onlyFavorites
      ? data.filter(s => s.isFavorite).map(s => s.symbol)
      : data.map(s => s.symbol)

    if (symbolNames.length) {
      setSymbols(symbolNames)
      onChange({ id: 'symbol', value: symbolNames[0] })
    } else {
      setSymbols(["NO SYMBOLS"])
    }
  }, [onlyFavorites])

  useEffect(() => {
    fetchSymbols()
  }, [])

  function onFavoriteClick() {

    setOnlyFavorites(!onlyFavorites)
  }
  const selectSymbol = useMemo(() => {
    return (
      <div className="flex">
        <Button
          variant={"secondary"}
          onClick={() => onFavoriteClick()}
        >
          <Star className={cn(onlyFavorites && 'fill-yellow-400', 'text-yellow-400')} />
        </Button>
        <Select
          disabled={disabled}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Symbol" />
          </SelectTrigger>
          <SelectContent>
            {symbols.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

    )
  }, [symbols])

  return (
    selectSymbol
  )
}