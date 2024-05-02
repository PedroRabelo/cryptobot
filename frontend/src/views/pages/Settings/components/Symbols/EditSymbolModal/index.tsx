import { ISymbol } from "@/app/entities/Symbols"
import { Spinner } from "@/views/components/Spinner"
import { Button } from "@/views/components/ui/button"
import { Checkbox } from "@/views/components/ui/checkbox"
import {
  Dialog,
  DialogContent
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
  const { form, onSubmit, isPending, onFormError } = useEditSymbolModalController(symbol)

  return (
    <Dialog open={open} onOpenChange={setClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form
            className="grid gap-4 py-4"
            onSubmit={form.handleSubmit(onSubmit, onFormError)}>


            <FormField
              control={form.control}
              name="isFavorite"
              render={({ field }) => (
                <FormItem className="col-span-4">
                  <div className="flex items-center gap-2">
                    <Input
                      disabled value={symbol.symbol} />
                    <FormLabel>Favorito?</FormLabel>

                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          return field.onChange(checked)
                        }}
                      />
                    </FormControl>
                  </div>
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

            <Button type="submit">
              {isPending && <Spinner />}
              Save
            </Button>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
