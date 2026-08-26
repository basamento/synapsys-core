import type { CSSProperties } from "react";

export interface IconProps {
  /** Lucide icon name in kebab-case, e.g. "loader-circle", "pc-case". */
  name: string;
  /** Rendered box in px. 16 in rows and nav, 20 in metric tiles. */
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: CSSProperties;
}

export function Icon(props: IconProps): JSX.Element;
