import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * The mobile row shape. A table cannot work at 390px, so each record becomes a
 * card: title and pills, the mono identity line, two-up tiles, then actions.
 */
export function EntityCard({ children, className }: { children: ReactNode; className?: string }) {
  return <Card className={cn("gap-3 px-3.5 pt-3.5 pb-3", className)}>{children}</Card>;
}

export function EntityCardHead({
  title,
  subtitle,
  pills,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  pills?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.75">
        <span className="type-title text-heading">{title}</span>
        {pills}
      </div>
      {subtitle && <span className="type-mono-sm text-faint">{subtitle}</span>}
    </div>
  );
}

/** Two metric tiles side by side — the density mobile can carry. */
export function EntityCardTiles({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2.25">{children}</div>;
}

/** Full-width actions at the tap minimum, so a thumb can hit them. */
export function EntityCardActions({ children }: { children: ReactNode }) {
  return <div className="flex gap-2.25 [&>*]:flex-1">{children}</div>;
}
