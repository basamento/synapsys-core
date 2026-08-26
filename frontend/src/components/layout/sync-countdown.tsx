import { useEffect, useState } from "react";

import { Progress } from "@/components/ui/progress";
import { POLL_INTERVAL_MS } from "@/state/app-data-context";
import { useAppData } from "@/state/use-app-data";

const TICK_MS = 100;

/**
 * How long until the next snapshot. This only *shows* the poll — the provider
 * runs it, so the console stays current on layouts that have no room for this
 * meter. The meter running down is the loading indicator, which is why a
 * refresh never shows skeletons.
 */
export function SyncCountdown() {
  const { lastUpdatedAt } = useAppData();

  // The clock is held in state and advanced by the interval, so rendering stays
  // pure. Re-rendering ten times a second is confined to this component rather
  // than reaching the whole tree through context.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const elapsed = lastUpdatedAt ? now - new Date(lastUpdatedAt).getTime() : 0;
  const remaining = Math.max(0, POLL_INTERVAL_MS - elapsed);

  return (
    <div className="flex w-31 flex-col gap-1.25">
      <div className="flex justify-between type-eyebrow text-faint">
        <span>heartbeat</span>
        <span className="type-mono-sm text-muted-foreground">
          {Math.ceil(remaining / 1000)}s
        </span>
      </div>
      <Progress
        value={(remaining / POLL_INTERVAL_MS) * 100}
        aria-label="Time until next poll"
      />
    </div>
  );
}
