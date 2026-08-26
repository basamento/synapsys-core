import type { ReactNode } from "react";

import type { AppDataCollection, SortDirection } from "@/api/app-data";

/**
 * One column of a desktop listing.
 *
 * `sortKey` is the server's logical column name. A column without one is not
 * sortable, which is how the Actions column opts out.
 */
export type ListingColumn<T> = {
  key: string;
  header: string;
  /** CSS width. The single column that omits it absorbs the leftover space. */
  width?: string;
  align?: "left" | "right";
  sortKey?: string;
  /**
   * Secondary columns are dropped in the compact layout (700–1199px), where
   * keeping them would squeeze the name column down to an ellipsis. What
   * survives is what an operator needs to act: what it is, what state it is
   * in, and what they can do about it.
   */
  secondary?: boolean;
  cell: (row: T) => ReactNode;
};

/** A value the collection's one filter facet accepts. */
export type FilterOption = {
  value: string;
  label: string;
  /** Tailwind class for the swatch, when the facet is a state. */
  dotClass?: string;
};

/**
 * Everything that distinguishes one listing from another.
 *
 * ListingView reads this and renders the whole view — header, toolbar, table
 * or cards, filter sheet and pager. Adding a listing means writing one of
 * these; it never means writing another page shell.
 */
export type ListingDefinition<T> = {
  collection: AppDataCollection;
  /** The plural noun, and nothing more. */
  title: string;
  /** What the facet is called in the toolbar: "State", "Framework", "Type". */
  filterLabel: string;
  filterOptions: FilterOption[];
  columns: ListingColumn<T>[];
  /** The mobile and detail shape, where a table cannot work. */
  renderCard: (row: T) => ReactNode;
  getRowId: (row: T) => number;
  /** Shown when the collection is empty and nothing failed. */
  emptyMessage: string;
};

export type SortState = { sortKey: string; sortDir: SortDirection };
