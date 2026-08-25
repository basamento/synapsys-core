import { CoreStatusIndicator } from "./core-status-indicator";
import { ModeToggle } from "./mode-toggle";
import { SyncCountdown } from "./sync-countdown";

export function TopBar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 px-4 pt-4 backdrop-blur sm:px-6">
      <div className="flex min-h-14 items-center justify-between rounded-lg border bg-card px-4 shadow-xs sm:px-5">
        <div className="flex items-center gap-2 font-semibold">
          <h1 className="text-xl font-bold tracking-tight">Synapsys Cortex UI</h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <CoreStatusIndicator />
          <SyncCountdown />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
