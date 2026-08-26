import type { CSSProperties } from "react";

export interface SpinnerProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

export function Spinner(props: SpinnerProps): JSX.Element;
