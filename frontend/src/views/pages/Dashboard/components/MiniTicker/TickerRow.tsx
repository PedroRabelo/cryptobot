import { IMiniTicker } from "@/app/entities/MiniTicker";
import { TableCell, TableRow } from "@/views/components/ui/table";
import { useEffect, useMemo, useState } from "react";

interface ITickerRowProps {
  data: IMiniTicker;
  symbol: string;
}

export function TickerRow({ data, symbol }: ITickerRowProps) {
  const [ticker, setTicker] = useState<IMiniTicker>({
    close: '0',
    open: '0',
    high: '0',
    low: '0'
  })

  const tickerRow = useMemo(() => (
    <TableRow>
      <TableCell className="font-medium">{symbol}</TableCell>
      <TableCell>{`${ticker.close}`.substring(0, 8)}</TableCell>
      <TableCell>{`${ticker.open}`.substring(0, 8)}</TableCell>
      <TableCell className="text-right">{`${ticker.high}`.substring(0, 8)}</TableCell>
      <TableCell className="text-right">{`${ticker.low}`.substring(0, 8)}</TableCell>
    </TableRow>
  ), [data?.close, data?.open, data?.high, data?.low])

  useEffect(() => {
    if (!data) return

    if (ticker.close !== data.close) {
      ticker.close = data.close
    }

    if (ticker.open !== data.open) {
      ticker.open = data.open
    }

    if (ticker.high !== data.high) {
      ticker.high = data.high
    }

    if (ticker.low !== data.low) {
      ticker.low = data.low
    }

    setTicker(data)
  }, [data])

  return (tickerRow)
}