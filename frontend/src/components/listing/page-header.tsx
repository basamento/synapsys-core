import type { ReactNode } from "react";

/**
 * Display title, one meta line, and the view's controls.
 *
 * The meta line is the page description — counts and freshness joined by `·`.
 * No paragraph follows it, which is why this takes no `description`.
 */
export function PageHeader({
  title,
  meta,
  actions,
  below,
}: {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  below?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.75">
      <div className="flex items-start justify-between gap-3 sm:items-end sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="type-display-sm text-[24px] text-heading sm:type-display">{title}</h1>
          {meta && <p className="type-body-sm text-muted-foreground sm:type-body-md">{meta}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2.25">{actions}</div>}
      </div>
      {below}
    </div>
  );
}
