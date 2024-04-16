import { Button } from "@/views/components/ui/button";
import { Input } from "@/views/components/ui/input";

export function Settings() {
  return (
    <div className="flex min-h-[calc(100vh_-_theme(spacing.18))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8">
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <h1 className="text-3xl font-semibold">Settings</h1>
      </div>
      <form>
        <div className="mx-auto grid w-full max-w-6xl gap-2 pb-4">
          <h1 className="text-xl font-semibold">General Info</h1>
        </div>
        <div className="grid w-full items-center grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">

          <div className="col-span-full">
            <Input id="name" placeholder="Name of your project" />
          </div>

        </div>
        <div className="flex items-center pt-8">
          <Button>Save</Button>
        </div>
      </form>
    </div>
  )
}