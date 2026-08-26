import type { CSSProperties } from "react";

export interface CoreStatusIndicatorProps {
  /** Derived from the app-data fetch: ready → online, error → offline, loading → checking. */
  status?: "online" | "offline" | "checking";
  /** Shortens the label for the mobile top bar. */
  compact?: boolean;
  style?: CSSProperties;
}

export function CoreStatusIndicator(props: CoreStatusIndicatorProps): JSX.Element;
