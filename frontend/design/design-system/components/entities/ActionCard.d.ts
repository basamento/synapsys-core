import type { CSSProperties } from "react";

export interface ActionLike {
  id: number;
  executionId: number;
  type: "create" | "start" | "stop" | "heartbeat" | "ack";
  status: "done" | "waiting" | "failed";
  createdAt: string;
}

/**
 * @startingPoint section="Entities" subtitle="Action card, full and dense" viewport="700x200"
 */
export interface ActionCardProps {
  action: ActionLike;
  compact?: boolean;
  /** One-line variant for the Summary feed: icon, label, timestamp, status. */
  dense?: boolean;
  style?: CSSProperties;
}

export function ActionCard(props: ActionCardProps): JSX.Element;
