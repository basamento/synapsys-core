import type { CSSProperties } from "react";

export interface ExecutionLike {
  id: number;
  processId: number;
  runId?: number | null;
  status: "active" | "inactive";
  currentStatus: "idle" | "running" | "stopping" | "failed";
  desiredState: "idle" | "running" | "stopping" | "failed";
  createdAt: string;
  modifiedAt: string;
}

/**
 * @startingPoint section="Entities" subtitle="Execution card, current vs desired" viewport="700x190"
 */
export interface ExecutionCardProps {
  execution: ExecutionLike;
  compact?: boolean;
  style?: CSSProperties;
}

export function ExecutionCard(props: ExecutionCardProps): JSX.Element;
