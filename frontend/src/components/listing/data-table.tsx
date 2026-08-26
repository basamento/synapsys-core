import { ChevronDown, ChevronUp } from "lucide-react";

import type { SortDirection } from "@/api/app-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ListingColumn, SortState } from "./listing-definition";

/**
 * Renders any listing from its column definitions. Sorting is server-side:
 * clicking a sortable head reports the new key and direction upward, and the
 * next snapshot arrives already ordered.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  sort,
  onSortChange,
}: {
  columns: ListingColumn<T>[];
  rows: T[];
  getRowId: (row: T) => number;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
}) {
  function toggleSort(sortKey: string) {
    const nextDir: SortDirection =
      sort.sortKey === sortKey && sort.sortDir === "asc" ? "desc" : "asc";
    onSortChange({ sortKey, sortDir: nextDir });
  }

  return (
    <Table>
      <colgroup>
        {columns.map((column) => (
          <col key={column.key} style={column.width ? { width: column.width } : undefined} />
        ))}
      </colgroup>

      <TableHeader>
        <tr>
          {columns.map((column) => {
            const sorted = column.sortKey && column.sortKey === sort.sortKey;
            const Arrow = sort.sortDir === "asc" ? ChevronUp : ChevronDown;

            return (
              <TableHead
                key={column.key}
                aria-sort={sorted ? (sort.sortDir === "asc" ? "ascending" : "descending") : undefined}
                className={cn(sorted && "text-body")}
              >
                {column.sortKey ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(column.sortKey!)}
                    className={cn(
                      "flex w-full items-center gap-1.5 rounded-xs transition-colors hover:text-body",
                      column.align === "right" && "justify-end",
                    )}
                  >
                    {column.header}
                    {sorted && <Arrow aria-hidden className="size-3 text-brand" />}
                  </button>
                ) : (
                  <span
                    className={cn("flex items-center", column.align === "right" && "justify-end")}
                  >
                    {column.header}
                  </span>
                )}
              </TableHead>
            );
          })}
        </tr>
      </TableHeader>

      <TableBody>
        {rows.map((row) => (
          <TableRow key={getRowId(row)}>
            {columns.map((column) => (
              <TableCell key={column.key}>
                <div
                  className={cn(
                    "flex min-w-0 items-center",
                    column.align === "right" && "justify-end",
                  )}
                >
                  {column.cell(row)}
                </div>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
