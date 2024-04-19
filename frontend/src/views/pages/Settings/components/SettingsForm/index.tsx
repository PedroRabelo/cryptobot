import { Spinner } from "@/views/components/Spinner";
import { Button } from "@/views/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/views/components/ui/form";
import { Input } from "@/views/components/ui/input";
import { useSettingsFormController } from "./useSettingsFormController";

export function SettingsForm() {
  const { form, onSubmit, isPending, errorMessage } = useSettingsFormController()

  return (
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

        <div className="flex items-center pt-8 gap-4">
          <Button
            className="w-16"
            type="submit"
          >
            {isPending && <Spinner />}

            Save
          </Button>

          <span className="text-red-500">{errorMessage}</span>
        </div>
      </form>

    </Form>
  )
}