import { useAuth } from "@/app/hooks/useAuth";
import { settingsService } from "@/app/services/settingsService";
import { ISettingsParams } from "@/app/services/settingsService/updateSettings";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const settingsSchema = z.object({
  email: z.string().email("Digite um e-mail válido"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  apiUrl: z.string().min(32),
  accessKey: z.string().min(32),
  secretKey: z.string().optional()
})

type FormData = z.infer<typeof settingsSchema>

export function useSettingsFormController() {
  const { settings } = useAuth()

  const form = useForm<FormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      email: settings?.email,
      password: "",
      confirmPassword: "",
      apiUrl: settings?.apiUrl,
      accessKey: settings?.accessKey,
      secretKey: ""
    }
  })

  const [errorMessage, setErrorMessage] = useState("")

  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: ISettingsParams) => settingsService.updateSettings(data),
  });

  async function onSubmit(values: FormData) {
    try {
      if ((values.password || values.confirmPassword)
        && values.password !== values.confirmPassword) {

        setErrorMessage("O Campo senha e confirma senha, devem ser iguais")
        return;
      }

      const body: ISettingsParams = {
        email: values.email,
        password: values.password ? values.password : null,
        apiUrl: values.apiUrl,
        accessKey: values.accessKey,
        secretKey: values.secretKey ? values.secretKey : null
      }

      await mutateAsync(body);

      queryClient.invalidateQueries({ queryKey: ['settings'] });

      setErrorMessage("")
      toast.success('Settings atualizada com sucesso');
    } catch {
      toast.error('Não foi possível atualizar as settings!');
      setErrorMessage("")
    }
  }

  return {
    form,
    onSubmit,
    isPending,
    settings,
    errorMessage
  }
}