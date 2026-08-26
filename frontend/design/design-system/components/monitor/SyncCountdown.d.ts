import type { CSSProperties } from "react";

export interface SyncCountdownProps {
  /** 0-100 — remaining time in the 5s poll window. */
  percent?: number;
  seconds?: number;
  label?: string;
  width?: number;
  style?: CSSProperties;
}

export function SyncCountdown(props: SyncCountdownProps): JSX.Element;
