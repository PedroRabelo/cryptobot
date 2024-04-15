import { Spinner } from "@/views/components/Spinner";
import { Button } from "@/views/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/views/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/views/components/ui/form";
import { Input } from "@/views/components/ui/input";
import { useLoginController } from "./useLoginController";

export function Login() {
  const { form, onSubmit, isPending } = useLoginController()

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="w-full max-w-sm min-w-96">
            <CardHeader>
              <CardTitle className="text-2xl text-center">CryptoBOT</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                type="submit"
              >
                {isPending && <Spinner />}

                Entrar
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}