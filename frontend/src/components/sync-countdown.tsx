import { useCallback, useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { useNeurons } from "./neurons/useNeurons";

export function SyncCountdown() {
  const tickMs = 70;
  const durationMs = 5000;

  const { refreshNeurons } = useNeurons();

  const [remaining, setRemaining] = useState(durationMs);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const pendingRef = useRef(false);

  const runRefresh = useCallback(() => {
    // If a refresh is running, queue exactly one more.
    if (inFlightRef.current) {
      pendingRef.current = true;
      return;
    }

    inFlightRef.current = (async () => {
      try {
        await refreshNeurons();
      } finally {
        inFlightRef.current = null;

        // If we missed a cycle while fetching, run once more.
        if (pendingRef.current) {
          pendingRef.current = false;
          runRefresh();
        }
      }
    })();
  }, [refreshNeurons]);

  useEffect(() => {
    // Optional: fetch immediately on mount
    runRefresh();

    const id = setInterval(() => {
      setRemaining((p) => {
        const next = Math.max(p - tickMs, 0);
        if (next === 0) {
          // countdown completed: refresh and reset
          runRefresh();
          return durationMs;
        }
        return next;
      });
    }, tickMs);

    return () => clearInterval(id);
  }, [runRefresh]);

  const progressPct = (remaining / durationMs) * 100;
  return <Progress className="w-50" value={progressPct} />;
}
