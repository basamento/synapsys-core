import { Badge } from "@/components/ui/badge";
import type { ActionStatus, ExecutionState, ExecutionStatus } from "@/types/entities";
import { ACTION_STATUS_TONE, EXECUTION_STATUS_TONE, STATE_TONE } from "./tones";

/**
 * Every badge that carries meaning. Each reads its colour from `./tones`, so
 * this file decides shape and wording only.
 */

export function StateBadge({ state }: { state: ExecutionState }) {
  return <Badge tone={STATE_TONE[state]}>{state}</Badge>;
}

/** The state an operator asked for, outlined so it reads as intent, not fact. */
export function DesiredStateBadge({ state }: { state: ExecutionState }) {
  return (
    <Badge tone={STATE_TONE[state]} variant="outline">
      desired {state}
    </Badge>
  );
}

export function ExecutionStatusBadge({ status }: { status: ExecutionStatus }) {
  return <Badge tone={EXECUTION_STATUS_TONE[status]}>{status}</Badge>;
}

export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  return <Badge tone={ACTION_STATUS_TONE[status]}>{status}</Badge>;
}

/** Whether a worker has caught up with the command it was sent. */
export function SyncBadge({ pending }: { pending: boolean }) {
  return <Badge tone={pending ? "stopping" : "running"}>{pending ? "waiting" : "synced"}</Badge>;
}
