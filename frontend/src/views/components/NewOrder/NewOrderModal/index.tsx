import { Button } from "@/views/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/views/components/ui/dialog"
import { CreditCard } from "lucide-react"
import { SelectSymbol } from "../../SelectSymbol"
import { SymbolPrice } from "../SymbolPrice"
import { useNewOrderModalController } from "./useNewOrderModalController"

export function NewOrderModal() {
  const { onInputChange, order } = useNewOrderModalController()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <CreditCard />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>New Order</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-12 gap-2 py-4">
          <div className="col-span-4">
            <SelectSymbol
              onChange={(event) => onInputChange(event)}
            />
          </div>
          <div className="col-span-8">
            <SymbolPrice symbol={order.symbol} />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
