import type { CSSProperties } from "react";

export interface WorkerLike {
  id: number;
  name: string;
  host: string;
  framework: "springboot" | "nodejs" | "python" | "unknown";
  firstConnection: string;
  lastConnection: string;
  lastTouch: string;
  /** Processes attributed to this worker; renders an em dash when absent. */
  processCount?: number;
}

/**
 * @startingPoint section="Entities" subtitle="Worker card with connection history" viewport="700x190"
 */
export interface WorkerCardProps {
  worker: WorkerLike;
  compact?: boolean;
  style?: CSSProperties;
}

export function WorkerCard(props: WorkerCardProps): JSX.Element;
