import { ModeToggle } from "@/components/mode-toggle"
import { SyncCountdown } from "./sync-countdown";

export function TopBar() {

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-14 items-center justify-between px-6">

        {/* Left: Logo + Name */}
        <div className="flex items-center gap-2 font-semibold">
          {/* <div className="h-8 w-8 rounded bg-primary" /> */}
          <h1 className="text-xl font-bold tracking-tight">Synapsys Cortex UI</h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-7">
          <SyncCountdown />
          <ModeToggle />
        </div>

      </div>
    </header>
  )
}
