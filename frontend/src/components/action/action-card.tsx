import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { Action } from "@/types/entities";

type ActionCardProps = {
  action: Action;
};

export function ActionCard({ action }: ActionCardProps) {
  return (
    <Card className="p-4 transition-colors hover:bg-muted/40">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold">Action #{action.id}</h2>
              <TypeBadge type={action.type} />
              <StatusBadge status={action.status} />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Execution: <span className="font-mono text-foreground/90">#{action.executionId}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric label="Type" value={formatActionType(action.type)} />
          <Metric label="Status" value={formatActionStatus(action.status)} />
          <Metric label="Created" value={formatDateTime(action.createdAt)} />
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="break-words text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: Action["type"] }) {
  return (
    <Badge variant="outline" className="whitespace-nowrap">
      {formatActionType(type)}
    </Badge>
  );
}

function StatusBadge({ status }: { status: Action["status"] }) {
  if (status === "done") {
    return <Badge className="bg-green-600 text-white hover:bg-green-700">Done</Badge>;
  }
  if (status === "failed") {
    return <Badge variant="destructive">Failed</Badge>;
  }

  return <Badge className="bg-amber-600 text-white hover:bg-amber-700">Waiting</Badge>;
}

function formatActionType(type: Action["type"]) {
  if (type === "ack") return "Ack";
  if (type === "create") return "Create";
  if (type === "heartbeat") return "Heartbeat";
  if (type === "start") return "Start";
  return "Stop";
}

function formatActionStatus(status: Action["status"]) {
  if (status === "done") return "Done";
  if (status === "failed") return "Failed";
  return "Waiting";
}
