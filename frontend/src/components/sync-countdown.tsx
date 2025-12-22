import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

export function SyncCountdown() {
  const tickMs = 50;
  const durationMs = 5000;

  const [progress, setProgress] = useState<number>(durationMs);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress(p => {
        if (p === 0) return durationMs;
        return Math.max(p - tickMs, 0);
      });
    }, tickMs);

    return () => clearInterval(id);
  }, []);

  // derived value — no state, no effect
  const progressPct = (progress / durationMs) * 100;

  return (
    <Progress className="w-50" value={progressPct} />
  );
  
}
