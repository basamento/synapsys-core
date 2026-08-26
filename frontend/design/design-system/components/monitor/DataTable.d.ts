import type { CSSProperties, ReactNode } from "react";

export interface DataTableColumn {
  key: string;
  header: ReactNode;
  /** Any grid track value. Fixed px for state/type columns, 1fr for the name column. */
  width?: string;
  align?: "left" | "right";
  sortable?: boolean;
}

export interface DataTableRow {
  id?: string | number;
  cells: Record<string, ReactNode>;
  /** Subtle tint — first row, or the row an action was just fired on. */
  highlight?: boolean;
}

/**
 * @startingPoint section="Data" subtitle="Dense listing table with sort and footer" viewport="900x340"
 */
export interface DataTableProps {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  /** Usually a <ListingPagination>. */
  footer?: ReactNode;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  style?: CSSProperties;
}

export function DataTable(props: DataTableProps): JSX.Element;
