import type { CSSProperties, ReactNode } from "react";

export interface PageHeaderProps {
  title: ReactNode;
  /** One line of counts and freshness: "200 total · 10 on this page · polled 4 seconds ago". */
  meta?: ReactNode;
  /** Search, filters, Refresh. */
  actions?: ReactNode;
  /** Stacks title over actions and drops to the smaller display size — mobile. */
  compact?: boolean;
  style?: CSSProperties;
}

export function PageHeader(props: PageHeaderProps): JSX.Element;
