import type { PageInfo } from "@/api/app-data";

/**
 * Which rows of the whole collection are on screen — the "Showing 1–10 of 200"
 * fact, shared by the desktop footer and the mobile pager.
 */
export function visibleRange(pageInfo: PageInfo) {
  if (pageInfo.totalItems === 0) return { first: 0, last: 0 };

  return {
    first: (pageInfo.page - 1) * pageInfo.pageSize + 1,
    last: Math.min(pageInfo.page * pageInfo.pageSize, pageInfo.totalItems),
  };
}

/**
 * The current page with a neighbour either side, plus the first and last pages
 * so the ends of a long listing are always one click away. Gaps between those
 * groups collapse to an ellipsis.
 */
export function visiblePages(page: number, totalPages: number): Array<number | "gap"> {
  const wanted = new Set([1, page - 1, page, page + 1, totalPages]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);

  return pages.flatMap((entry, index) =>
    index > 0 && entry - pages[index - 1] > 1 ? ["gap" as const, entry] : [entry],
  );
}
