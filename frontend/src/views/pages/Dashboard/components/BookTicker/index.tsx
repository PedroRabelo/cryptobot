import { SelectQuote } from "@/views/components/SelectQuote"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/components/ui/card"
import { ScrollArea } from "@/views/components/ui/scroll-area"
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/views/components/ui/table"
import { BookRow } from "./BookRow"
import { useBookTickerController } from "./useBookTickerController"

interface IBookTickerProps {
  bookTickerData: any | undefined
}

export function BookTicker({ bookTickerData }: IBookTickerProps) {
  const { symbols, onQuoteChange } = useBookTickerController()

  return (
    <div className="flex">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Book</CardTitle>
            <SelectQuote onChange={(value) => onQuoteChange(value)} />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-72 w-full rounded-md border">
            <Table>
              <TableCaption>A list at real time quote</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Symbol</TableHead>
                  <TableHead>Bid</TableHead>
                  <TableHead>Ask</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {
                  symbols && symbols.map(item => (
                    <BookRow key={item} data={bookTickerData[item]} symbol={item} />
                  ))
                }
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}