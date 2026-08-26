import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PageInfo } from "@/api/app-data";
import { cn } from "@/lib/utils";
import { visiblePages, visibleRange } from "./page-range";
import { PageSizeControl } from "./page-size-control";

/**
 * The table's footer: what is on screen, how many rows a page holds, and the
 * pager. It lives inside the table card rather than below it, so the listing
 * reads as one object.
 */
export function ListingPagination({
  pageInfo,
  onPageChange,
  onPageSizeChange,
}: {
  pageInfo: PageInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const { first, last } = visibleRange(pageInfo);

  return (
    <div className="flex flex-col gap-3 border-t border-edge bg-subtle px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="type-body-sm text-muted-foreground">
        Showing <Numeral>{first}</Numeral>–<Numeral>{last}</Numeral> of{" "}
        <Numeral>{pageInfo.totalItems}</Numeral>
      </span>

      <div className="flex flex-wrap items-center gap-2.5">
        <PageSizeControl value={pageInfo.pageSize} onChange={onPageSizeChange} />
        <Pager pageInfo={pageInfo} onPageChange={onPageChange} />
      </div>
    </div>
  );
}

function Pager({
  pageInfo,
  onPageChange,
}: {
  pageInfo: PageInfo;
  onPageChange: (page: number) => void;
}) {
  const { page, totalPages } = pageInfo;

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <PagerArrow
        label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft aria-hidden className="size-3.25" />
      </PagerArrow>

      {visiblePages(page, totalPages).map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} aria-hidden className="px-1 type-body-sm text-faint">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            aria-label={`Page ${entry}`}
            aria-current={entry === page ? "page" : undefined}
            onClick={() => onPageChange(entry)}
            className={cn(
              "inline-flex h-7 min-w-7 items-center justify-center rounded-sm px-1.5 type-body-sm transition-colors",
              entry === page
                ? "bg-brand-soft font-bold text-brand-soft-text"
                : "font-medium text-body hover:bg-sunken",
            )}
          >
            {entry}
          </button>
        ),
      )}

      <PagerArrow
        label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight aria-hidden className="size-3.25" />
      </PagerArrow>
    </nav>
  );
}

function PagerArrow({
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
      className="inline-flex size-7 items-center justify-center rounded-sm border border-edge bg-surface text-body transition-colors hover:bg-subtle"
    >
      {children}
    </button>
  );
}

/** Machine-reported numerals get the mono face, even mid-sentence. */
function Numeral({ children }: { children: React.ReactNode }) {
  return <span className="type-mono-md text-heading">{children}</span>;
}
