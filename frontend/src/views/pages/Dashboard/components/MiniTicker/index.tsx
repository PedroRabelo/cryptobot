import { SelectQuote } from "@/views/components/SelectQuote";
import { Card, CardContent, CardHeader, CardTitle } from "@/views/components/ui/card";
import { ScrollArea } from "@/views/components/ui/scroll-area";
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/views/components/ui/table";
import { TickerRow } from "./TickerRow";
import { useMiniTickerController } from "./useMiniTickerController";

interface IMiniTickerProps {
  miniTickerData: any | undefined
}

export function MiniTicker({ miniTickerData }: IMiniTickerProps) {
  const { onQuoteChange, symbols } = useMiniTickerController()

  if (!miniTickerData) return <></>

  return (
    <div className="flex">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Market 24h</CardTitle>
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
                  <TableHead>Close</TableHead>
                  <TableHead>Open</TableHead>
                  <TableHead className="text-right">High</TableHead>
                  <TableHead className="text-right">Low</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {
                  symbols && symbols.map(item => (
                    <TickerRow key={item} data={miniTickerData[item]} symbol={item} />
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