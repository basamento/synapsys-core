import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { Execution } from "@/types/entities";

type ExecutionCardProps = {
  execution: Execution;
};

export function ExecutionCard({ execution }: ExecutionCardProps) {
  return (
    <Card className="p-4 transition-colors hover:bg-muted/40">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold">Execution #{execution.id}</h2>
              <StatusBadge status={execution.status} />
              <StateBadge state={execution.currentStatus} />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Process: <span className="font-mono text-foreground/90">#{execution.processId}</span>
              {execution.runId != null && (
                <> · Run: <span className="font-mono text-foreground/90">{execution.runId}</span></>
              )}
            </div>
          </div>

          <Badge variant="outline" className="w-fit">
            desired {formatState(execution.desiredState)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Current Status" value={formatState(execution.currentStatus)} />
          <Metric label="Desired State" value={formatState(execution.desiredState)} />
          <Metric label="Created" value={formatDateTime(execution.createdAt)} />
          <Metric label="Modified" value={formatDateTime(execution.modifiedAt)} />
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

function StatusBadge({ status }: { status: Execution["status"] }) {
  if (status === "active") {
    return <Badge className="bg-green-600 text-white hover:bg-green-700">Active</Badge>;
  }

  return <Badge variant="secondary">Inactive</Badge>;
}

function StateBadge({ state }: { state: Execution["currentStatus"] }) {
  if (state === "running") {
    return <Badge className="bg-violet-600 text-white hover:bg-violet-700">Running</Badge>;
  }
  if (state === "stopping") {
    return <Badge className="bg-amber-600 text-white hover:bg-amber-700">Stopping</Badge>;
  }
  if (state === "failed") {
    return <Badge variant="destructive">Failed</Badge>;
  }

  return <Badge className="bg-blue-600 text-white hover:bg-blue-700">Idle</Badge>;
}

function formatState(state: Execution["currentStatus"]) {
  if (state === "running") return "Running";
  if (state === "stopping") return "Stopping";
  if (state === "failed") return "Failed";
  return "Idle";
}
