import type { CSSProperties, ReactNode } from "react";

export interface MetricTileProps {
  /** Mono uppercase eyebrow: LAST TOUCH, FRAMEWORK, TYPE. */
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  /** Set for timestamps, ids and tokens. */
  mono?: boolean;
  style?: CSSProperties;
}

export function MetricTile(props: MetricTileProps): JSX.Element;
