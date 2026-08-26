import type { ReactNode } from "react";

export interface SheetProps {
  open?: boolean;
  /** bottom = mobile filter/detail sheet with a grab handle · right = desktop drawer */
  side?: "bottom" | "right";
  title?: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  height?: number | string;
  children?: ReactNode;
}

export function Sheet(props: SheetProps): JSX.Element | null;
