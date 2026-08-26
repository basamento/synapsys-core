import { cn } from "@/lib/utils";
import type { ExecutionState } from "@/types/entities";
import { STATE_DISPLAY_ORDER } from "./tones";

/** The one gradient in the console — conic, and nowhere else. */

export function StateDonut({
  counts,
  total,
  size = 104,
  className,
}: {
  counts: Partial<Record<ExecutionState, number>>;
  total: number;
  size?: number;
  className?: string;
}) {
  const inner = Math.round(size * 0.69);

  let cursor = 0;
  const stops = STATE_DISPLAY_ORDER.map((state) => {
    const from = cursor;
    cursor += ((counts[state] ?? 0) / (total || 1)) * 100;
    return `var(--state-${state}-dot) ${from}% ${cursor}%`;
  }).join(", ");

  return (
    <div
      className={cn("grid shrink-0 place-items-center rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: total > 0 ? `conic-gradient(${stops})` : "var(--meter-track)",
      }}
    >
      <div
        className="flex flex-col items-center justify-center rounded-full bg-surface"
        style={{ width: inner, height: inner }}
      >
        <span className="type-display-sm text-heading">{total}</span>
        <span className="type-eyebrow text-faint">loaded</span>
      </div>
    </div>
  );
}
