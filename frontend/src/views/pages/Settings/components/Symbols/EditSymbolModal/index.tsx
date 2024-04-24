import { ISymbol } from "@/app/entities/Symbols"
import { Button } from "@/views/components/ui/button"
import { Checkbox } from "@/views/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/views/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/views/components/ui/form"
import { Input } from "@/views/components/ui/input"
import { useEditSymbolModalController } from "./useEditSymbolModalController"

interface IProps {
  symbol: ISymbol;
  open: boolean;
  setClose(): void;
}

export function EditSymbolModal({ symbol, open, setClose }: IProps) {
  const { form, onSubmit } = useEditSymbolModalController(symbol)

  return (
    <Dialog open={open} onOpenChange={setClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form
            className="grid gap-4 py-4"
            onSubmit={form.handleSubmit(onSubmit)}>

            <FormField
              control={form.control}
              name="isFavorite"
              render={({ field }) => (
                <FormItem className="col-span-4">
                  <FormLabel>Symbol:</FormLabel>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        return field.onChange(checked)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="basePrecision"
              render={({ field }) => (
                <FormItem className="col-span-4">
                  <FormLabel>Base Precision:</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quotePrecision"
              render={({ field }) => (
                <FormItem className="col-span-4">
                  <FormLabel>Quote Precision:</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minNotional"
              render={({ field }) => (
                <FormItem className="col-span-4">
                  <FormLabel>Min. Notional:</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minLotSize"
              render={({ field }) => (
                <FormItem className="col-span-4">
                  <FormLabel>Min. Lot Size:</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogHeader>
          <DialogTitle>Edit symbol</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button type="submit">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
