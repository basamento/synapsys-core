import type { CSSProperties } from "react";

export interface ProgressProps {
  /** 0-100. Values outside the range are clamped. */
  value?: number;
  tone?: "brand" | "running" | "idle" | "stopping" | "failed";
  /** Track height in px. 4 everywhere except the sync countdown (3). */
  height?: number;
  style?: CSSProperties;
}

export function Progress(props: ProgressProps): JSX.Element;
