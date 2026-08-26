import type { CSSProperties } from "react";

export interface PaginationProps {
  page?: number;
  totalPages?: number;
  onChange?: (page: number) => void;
  style?: CSSProperties;
}

export function Pagination(props: PaginationProps): JSX.Element;
