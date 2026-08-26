import type { CSSProperties, ReactNode } from "react";

export interface BadgeProps {
  /** Semantic tone. The four state tones map 1:1 to ExecutionState. */
  tone?: "neutral" | "brand" | "running" | "idle" | "stopping" | "failed";
  /** soft = tinted fill (default) · outline = hairline, transparent */
  variant?: "soft" | "outline";
  /** Leading 6px dot in the current colour. */
  dot?: boolean;
  /** Render the label in IBM Plex Mono — for ids, counts, tokens. */
  mono?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Badge(props: BadgeProps): JSX.Element;
