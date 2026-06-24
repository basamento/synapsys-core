import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";

type ListingShellProps = {
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
};

export function ListingShell({ header, children, footer }: ListingShellProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0">
        {header}
        <Separator className="my-4" />
      </div>

      <div className="min-h-0 flex-1 overflow-auto pr-1">
        <div className="flex flex-col gap-3">{children}</div>
      </div>

      <div className="mt-4 shrink-0 border-t pt-3">{footer}</div>
    </div>
  );
}
