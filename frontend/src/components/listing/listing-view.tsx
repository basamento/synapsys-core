import { isNarrowed } from "@/api/app-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLayout } from "@/hooks/use-layout";
import { formatRelative, metaLine } from "@/lib/format";
import { useAppData } from "@/state/use-app-data";
import { DataTable } from "./data-table";
import type { ListingDefinition } from "./listing-definition";
import { ListingFilter } from "./listing-filter";
import { ListingPagination } from "./listing-pagination";
import { MobilePager } from "./mobile-pager";
import { PageHeader } from "./page-header";
import { SearchField } from "./search-field";

/**
 * The whole of a listing view, driven entirely by its definition: header,
 * toolbar, table on desktop or cards on mobile, and the pager.
 *
 * All four listings share this, so the shell exists once. What differs between
 * Processes and Actions is a ListingDefinition, never a layout.
 */
export function ListingView<T>({
  definition,
  rows,
}: {
  definition: ListingDefinition<T>;
  rows: T[];
}) {
  const { collection, title, filterLabel, filterOptions, columns, renderCard } = definition;
  const { query, pagination, status, error, lastUpdatedAt, updateQuery, refreshAppData } =
    useAppData();

  const layout = useLayout();
  const isMobile = layout === "mobile";

  // Between 700 and 1199px the table keeps only what an operator acts on.
  const visibleColumns =
    layout === "compact" ? columns.filter((column) => !column.secondary) : columns;

  const listingQuery = query[collection];
  const pageInfo = pagination[collection];
  const searchPlaceholder = `Search ${title.toLowerCase()}`;

  // First load shows skeletons; a refresh does not, because the countdown is
  // already saying that data is moving.
  const firstLoad = status === "loading" || status === "idle";
  const failed = status === "error";

  const meta = metaLine(
    `${pageInfo.totalItems} total`,
    `${rows.length} on this page`,
    isNarrowed(listingQuery) && "filtered",
    !isMobile && formatRelative(lastUpdatedAt),
  );

  const filter = (
    <ListingFilter
      title={title}
      facetLabel={filterLabel}
      options={filterOptions}
      selected={listingQuery.filters}
      pageSize={listingQuery.pageSize}
      onSelectedChange={(filters) => updateQuery(collection, { filters })}
      onPageSizeChange={(pageSize) => updateQuery(collection, { pageSize })}
    />
  );

  const search = (
    <SearchField
      value={listingQuery.search}
      onChange={(search) => updateQuery(collection, { search })}
      placeholder={searchPlaceholder}
    />
  );

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <PageHeader
        title={title}
        meta={meta}
        actions={
          isMobile ? (
            filter
          ) : (
            <>
              <div className="w-51">{search}</div>
              {filter}
              <Button onClick={() => void refreshAppData()}>Refresh</Button>
            </>
          )
        }
        below={isMobile ? search : undefined}
      />

      {failed ? (
        <ListingMessage tone="failed">{error ?? `Failed to load ${title.toLowerCase()}.`}</ListingMessage>
      ) : firstLoad && rows.length === 0 ? (
        <ListingSkeleton isMobile={isMobile} columns={visibleColumns.length} />
      ) : rows.length === 0 ? (
        <ListingMessage>
          {isNarrowed(listingQuery)
            ? `No ${title.toLowerCase()} match this filter.`
            : definition.emptyMessage}
        </ListingMessage>
      ) : isMobile ? (
        <>
          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <div key={definition.getRowId(row)}>{renderCard(row)}</div>
            ))}
          </div>
          <MobilePager
            pageInfo={pageInfo}
            onPageChange={(page) => updateQuery(collection, { page })}
          />
        </>
      ) : (
        <Card className="overflow-hidden">
          <DataTable
            columns={visibleColumns}
            rows={rows}
            getRowId={definition.getRowId}
            sort={listingQuery}
            onSortChange={(sort) => updateQuery(collection, sort)}
          />
          <ListingPagination
            pageInfo={pageInfo}
            onPageChange={(page) => updateQuery(collection, { page })}
            onPageSizeChange={(pageSize) => updateQuery(collection, { pageSize })}
          />
        </Card>
      )}
    </div>
  );
}

/** Errors and empty states are one centred line. The console has no toasts. */
function ListingMessage({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "failed";
  children: React.ReactNode;
}) {
  return (
    <Card>
      <p
        className={`px-5 py-12 text-center type-body-md ${
          tone === "failed" ? "text-failed-fg" : "text-muted-foreground"
        }`}
      >
        {children}
      </p>
    </Card>
  );
}

/** One placeholder per element, matching the shape that replaces it. */
function ListingSkeleton({ isMobile, columns }: { isMobile: boolean; columns: number }) {
  const rows = Array.from({ length: 6 }, (_, index) => index);

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <Card key={row} className="gap-3 px-3.5 pt-3.5 pb-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
            <div className="grid grid-cols-2 gap-2.25">
              <Skeleton className="h-13" />
              <Skeleton className="h-13" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-9.5 border-b border-edge bg-subtle" />
      {rows.map((row) => (
        <div
          key={row}
          className="flex h-12.5 items-center gap-4 border-b border-edge px-5 last:border-b-0"
        >
          {Array.from({ length: columns }, (_, cell) => (
            <Skeleton key={cell} className={cell === 0 ? "h-3.5 flex-1" : "h-3.5 w-16"} />
          ))}
        </div>
      ))}
    </Card>
  );
}
