
import { SettingsForm } from "./components/SettingsForm";
import { Symbols } from "./components/Symbols";

export function Settings() {
  return (
    <div className="flex min-h-[calc(100vh_-_theme(spacing.18))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8">
      <div className="mx-auto grid w-full gap-2">
        <h1 className="text-3xl font-semibold">Settings</h1>
      </div>

      <SettingsForm />

      <Symbols />

    </div>
  )
}