import type { CSSProperties } from "react";

export interface ProcessOverviewLike {
  id: number;
  name: string;
  workerName: string;
  host?: string;
  type: "endless" | "progressive";
  framework: "springboot" | "nodejs" | "python" | "unknown";
  currentState: "idle" | "running" | "stopping" | "failed";
  desiredState: string;
  desiredToken: number;
  ackToken: number;
  /** Pre-formatted clock string, e.g. "18:10:40". */
  lastTouch: string;
}

/**
 * @startingPoint section="Entities" subtitle="Process card with Start/Stop" viewport="700x200"
 */
export interface ProcessCardProps {
  process: ProcessOverviewLike;
  /** Mobile: stacks the actions full-width and drops the metric grid to two columns. */
  compact?: boolean;
  onStart?: () => void;
  onStop?: () => void;
  style?: CSSProperties;
}

export function ProcessCard(props: ProcessCardProps): JSX.Element;
