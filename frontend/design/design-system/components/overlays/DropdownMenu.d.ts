import type { ReactNode } from "react";

export interface DropdownMenuItem {
  value: string | number;
  label: ReactNode;
  active?: boolean;
}

export interface DropdownMenuProps {
  /** Initial open state; the component keeps its own after that. */
  open?: boolean;
  /** Any element — usually an outline Button. */
  trigger: ReactNode;
  items: DropdownMenuItem[];
  align?: "start" | "end";
  onSelect?: (value: string | number) => void;
  width?: number;
}

export function DropdownMenu(props: DropdownMenuProps): JSX.Element;
