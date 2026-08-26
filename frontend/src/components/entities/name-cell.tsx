import type { ReactNode } from "react";

/**
 * The first column of every listing: what the record is called, followed by
 * how the core identifies it. The name is Manrope because a human chose it;
 * the identity line is mono because the core reported it.
 */
export function NameCell({ title, identity }: { title: ReactNode; identity?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-2.25">
      <span className="truncate type-body-lg font-semibold text-heading">{title}</span>
      {identity && <span className="truncate type-mono-sm text-faint">{identity}</span>}
    </div>
  );
}

/** A value the core reported, in a table cell. */
export function MonoCell({ children }: { children: ReactNode }) {
  return <span className="truncate type-mono-md text-muted-foreground">{children}</span>;
}

/** A value a human would write, in a table cell. */
export function TextCell({ children }: { children: ReactNode }) {
  return <span className="truncate type-body-md text-body">{children}</span>;
}
