import { Spinner } from "@/views/components/Spinner";
import { Button } from "@/views/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/views/components/ui/form";
import { Input } from "@/views/components/ui/input";
import { useSettingsController } from "./useSettingsController";

export function Settings() {
  const { form, onSubmit, isPending } = useSettingsController()

  return (
    <div className="flex min-h-[calc(100vh_-_theme(spacing.18))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8">
      <div className="mx-auto grid w-full gap-2">
        <h1 className="text-3xl font-semibold">Settings</h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="mx-auto grid w-full gap-2 pb-4">
            <h1 className="text-xl font-semibold">General Info</h1>
          </div>
          <div className="grid w-full items-center grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="col-span-4">
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
                <FormItem className="col-start-1 col-span-2">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mx-auto grid w-full gap-2 pt-8 pb-4">
            <h1 className="text-xl font-semibold">Exchange Info</h1>
          </div>
          <div className="grid w-full items-center grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">

            <FormField
              control={form.control}
              name="apiUrl"
              render={({ field }) => (
                <FormItem className="col-span-4">
                  <FormLabel>API URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the API URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessKey"
              render={({ field }) => (
                <FormItem className=" col-start-1 col-span-4">
                  <FormLabel>Access Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the API Access Key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secretKey"
              render={({ field }) => (
                <FormItem className=" col-start-1 col-span-4">
                  <FormLabel>Secret Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your API Secret Key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center pt-8">
            <Button
              className="w-16"
              type="submit"
            >
              {isPending && <Spinner />}

              Save
            </Button>
          </div>
        </form>

      </Form>
    </div>
  )
}