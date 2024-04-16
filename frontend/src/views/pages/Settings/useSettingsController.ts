import { useAuth } from "@/app/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const settingsSchema = z.object({
  email: z.string().email("Digite um e-mail válido"),
  password: z.string().min(4, "Digite uma senha válida"),
  confirmPassword: z.string().min(4, "Digite uma senha válida"),
  apiUrl: z.string().min(32),
  accessKey: z.string().min(32),
  secretKey: z.string().min(32)
})

type FormData = z.infer<typeof settingsSchema>;


export function useSettingsController() {
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

  async function onSubmit(values: FormData) {
    console.log(values)
  }

  return {
    form,
    onSubmit,
    isPending: false,
    settings
  }
}