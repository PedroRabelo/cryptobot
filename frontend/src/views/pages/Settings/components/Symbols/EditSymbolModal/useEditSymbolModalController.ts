import { ISymbol } from "@/app/entities/Symbols";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const symbolsSchema = z.object({
  isFavorite: z.boolean(),
  basePrecision: z.number().min(1, 'Digite um valor'),
  quotePrecision: z.number().min(1, 'Digite um valor'),
  minNotional: z.string().min(1, 'Digite um valor'),
  minLotSize: z.string().min(1, 'Digite um valor'),
})

type FormData = z.infer<typeof symbolsSchema>

export function useEditSymbolModalController(symbol: ISymbol) {
  const form = useForm<FormData>({
    resolver: zodResolver(symbolsSchema),
    defaultValues: {
      isFavorite: symbol.isFavorite,
      basePrecision: symbol.basePrecision,
      quotePrecision: symbol.quotePrecision,
      minNotional: symbol.minNotional,
      minLotSize: symbol.minLotSize
    }
  })

  async function onSubmit(values: FormData) {
    console.log(values)
  }

  return {
    form,
    onSubmit,
  }
}