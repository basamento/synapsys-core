import type { CSSProperties } from "react";

export interface StateBadgeProps {
  /** ExecutionState from the API. Colour and label both derive from it. */
  state?: "idle" | "running" | "stopping" | "failed";
  /** Renders the operator's requested state as an outline pill: "desired running". */
  desired?: boolean;
  dot?: boolean;
  style?: CSSProperties;
}

export function StateBadge(props: StateBadgeProps): JSX.Element;
