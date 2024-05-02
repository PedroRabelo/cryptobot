import { ISymbol } from "@/app/entities/Symbols";
import { symbolsService } from "@/app/services/symbolsService";
import { ISymbolParams } from "@/app/services/symbolsService/updateSymbol";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SubmitErrorHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
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

  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: ISymbolParams) => symbolsService.updateSymbol(symbol.symbol, data),
  });

  async function onSubmit(values: FormData) {
    try {
      const body: ISymbolParams = {
        isFavorite: values.isFavorite,
        basePrecision: values.basePrecision,
        quotePrecision: values.quotePrecision,
        minLotSize: values.minLotSize,
        minNotional: values.minNotional
      }

      await mutateAsync(body);

      queryClient.invalidateQueries({ queryKey: ['symbols'] });

      toast.success('Symbol atualizado com sucesso');
    } catch {
      toast.error('Não foi possível atualizar os symbols!');
    }
  }

  const onFormError: SubmitErrorHandler<FormData> = (e) => {
    console.error(e)
  }

  return {
    form,
    onSubmit,
    isPending,
    onFormError
  }
}