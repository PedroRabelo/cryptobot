import { useAuth } from "@/app/hooks/useAuth";
import { authService } from "@/app/services/authService";
import { ISigninParams } from "@/app/services/authService/signin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Digite um e-mail válido"),
  password: z.string().min(4, "Digite uma senha válida")
})

type FormData = z.infer<typeof loginSchema>;

export function useLoginController() {
  const form = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  })

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: ISigninParams) => authService.signin(data),
  });

  const { signin } = useAuth();

  async function onSubmit(values: FormData) {
    try {
      const { token } = await mutateAsync(values);

      signin(token);
    } catch {
      toast.error('Credenciais inválidas!');
    }
  }

  return {
    form,
    onSubmit,
    isPending
  }
}