import type { ReactNode } from "react";

import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A titled card. Every block on the Summary view is one of these, so the
 * heading rhythm is defined once rather than per panel.
 */
export function Panel({
  title,
  description,
  aside,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardBody>
        {(title || aside) && (
          <CardHeader>
            <div className="flex min-w-0 flex-col gap-0.75">
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {aside}
          </CardHeader>
        )}
        {children}
      </CardBody>
    </Card>
  );
}

/** A dense row on the sunken plane — the shape used by the queue and history lists. */
export function PanelRow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border border-edge bg-subtle px-3 py-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The bordered square an icon sits in inside a panel row. */
export function IconSquare({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-7.5 shrink-0 place-items-center rounded-sm border border-edge bg-surface text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
