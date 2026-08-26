import type { CSSProperties } from "react";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  style?: CSSProperties;
}

export function Separator(props: SeparatorProps): JSX.Element;
