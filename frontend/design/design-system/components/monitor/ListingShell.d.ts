import type { CSSProperties, ReactNode } from "react";

export interface ListingShellProps {
  /** A <PageHeader>. */
  header?: ReactNode;
  /** A <ListingPagination> when the list isn't inside a DataTable. */
  footer?: ReactNode;
  gap?: number;
  style?: CSSProperties;
  children?: ReactNode;
}

export function ListingShell(props: ListingShellProps): JSX.Element;
