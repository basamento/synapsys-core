import type { CSSProperties } from "react";

export interface ListingPaginationProps {
  page?: number;
  pageSize?: number;
  totalItems?: number;
  /** Segmented sizes. The app's API accepts 5/10/20/50; the design shows three. */
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  style?: CSSProperties;
}

export function ListingPagination(props: ListingPaginationProps): JSX.Element;
