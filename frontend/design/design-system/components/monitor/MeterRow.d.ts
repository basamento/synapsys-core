import type { CSSProperties, ReactNode } from "react";

export interface MeterRowProps {
  label: ReactNode;
  value?: number;
  /** Denominator for the bar. Pass the loaded-page size, not the API total. */
  total?: number;
  tone?: "brand" | "running" | "idle" | "stopping" | "failed";
  /** Leading colour dot — on for state rows, off for framework rows. */
  dot?: boolean;
  showBar?: boolean;
  style?: CSSProperties;
}

export function MeterRow(props: MeterRowProps): JSX.Element;
