import type { ReactNode } from "react";

export interface DialogProps {
  open?: boolean;
  title: ReactNode;
  description?: ReactNode;
  /** Action row, right-aligned. Cancel as outline, confirm as default/destructive. */
  footer?: ReactNode;
  width?: number;
  onClose?: () => void;
  children?: ReactNode;
}

export function Dialog(props: DialogProps): JSX.Element | null;
