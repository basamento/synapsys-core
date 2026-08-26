import type { CSSProperties } from "react";

export interface StateDonutProps {
  /** Counts keyed by ExecutionState; missing keys count as 0. */
  counts?: Partial<Record<"running" | "idle" | "stopping" | "failed", number>>;
  total?: number;
  size?: number;
  caption?: string;
  style?: CSSProperties;
}

export function StateDonut(props: StateDonutProps): JSX.Element;
