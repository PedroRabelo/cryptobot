import { TableCell, TableRow } from "@/views/components/ui/table";
import { useEffect, useMemo, useState } from "react";

interface IBookRowProps {
  data: { bestBid: string; bestAsk: string };
  symbol: string;
}

export function BookRow({ data, symbol }: IBookRowProps) {
  const [book, setBook] = useState<{ bid: string; ask: string }>({
    bid: '0',
    ask: '0',
  })

  const bookRow = useMemo(() => (
    <TableRow>
      <TableCell className="font-medium">{symbol}</TableCell>
      <TableCell>{`${book.bid}`.substring(0, 8)}</TableCell>
      <TableCell>{`${book.ask}`.substring(0, 8)}</TableCell>
    </TableRow>
  ), [book?.bid, book?.ask])

  useEffect(() => {
    if (!data) return

    if (book.bid !== data.bestBid) {
      book.bid = data.bestBid
    }

    if (book.ask !== data.bestAsk) {
      book.ask = data.bestAsk
    }

    setBook({
      bid: data.bestBid,
      ask: data.bestAsk
    })
  }, [data])

  return (bookRow)
}