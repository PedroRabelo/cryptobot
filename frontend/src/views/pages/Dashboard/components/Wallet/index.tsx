import { Card, CardContent, CardHeader, CardTitle } from "@/views/components/ui/card"
import { ScrollArea } from "@/views/components/ui/scroll-area"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/views/components/ui/table"
import { useWalletController } from "./useWalletController"

interface IWalletProps {
  data: any[] | undefined
}

export function Wallet({ data }: IWalletProps) {
  const { balances } = useWalletController(data)

  if (!data) return <></>

  return (
    <div className="flex">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Wallet</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-72 w-full rounded-md border">
            <Table>
              <TableCaption>A list at real time wallet</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Symbol</TableHead>
                  <TableHead>Free</TableHead>
                  <TableHead>Lock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {
                  balances && balances.map(item => (
                    <TableRow key={item.symbol}>
                      <TableCell className="font-medium">{item.symbol}</TableCell>
                      <TableCell>{`${item.available}`.substring(0, 8)}</TableCell>
                      <TableCell>{`${item.onOrder}`.substring(0, 8)}</TableCell>
                    </TableRow>
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