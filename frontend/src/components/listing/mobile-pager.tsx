import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PageInfo } from "@/api/app-data";
import { visibleRange } from "./page-range";

/**
 * Mobile has no room for numbered pages, so it shows the range on the left and
 * prev/next with a position readout on the right.
 */
export function MobilePager({
  pageInfo,
  onPageChange,
}: {
  pageInfo: PageInfo;
  onPageChange: (page: number) => void;
}) {
  const { first, last } = visibleRange(pageInfo);
  const { page, totalPages } = pageInfo;

  return (
    <div className="flex items-center justify-between gap-2.5 pt-3 pb-0.5">
      <span className="type-body-sm text-muted-foreground">
        <span className="type-mono-md text-heading">
          {first}–{last}
        </span>{" "}
        of <span className="type-mono-md text-heading">{pageInfo.totalItems}</span>
      </span>

      <div className="flex items-center gap-2">
        <Arrow label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft aria-hidden className="size-3.75" />
        </Arrow>
        <span className="min-w-11.5 text-center type-mono-md text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Arrow
          label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight aria-hidden className="size-3.75" />
        </Arrow>
      </div>
    </div>
  );
}

function Arrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-10 w-11 place-items-center rounded-md border border-edge bg-surface text-body transition-colors"
    >
      {children}
    </button>
  );
}
