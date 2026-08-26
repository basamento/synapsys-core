import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A labelled fact on the sunken plane — the third background layer, used only
 * for tiles sitting inside a card.
 *
 * `mono` marks a value the core reported (a host, a clock, a token pair) and
 * switches it to the mono face, following the system's one legibility rule.
 */
export function MetricTile({
  label,
  value,
  hint,
  icon,
  mono = false,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2.5 rounded-md border border-edge bg-subtle px-3.25 py-2.75",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.25">
        <span className="type-eyebrow text-faint uppercase">{label}</span>
        <span
          className={cn(
            "text-heading break-words",
            mono ? "type-mono-md" : "type-body-lg font-semibold",
          )}
        >
          {value}
        </span>
        {hint && <span className="type-caption text-muted-foreground">{hint}</span>}
      </div>
      {icon}
    </div>
  );
}
