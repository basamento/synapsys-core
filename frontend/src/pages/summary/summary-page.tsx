import {
  Activity,
  Boxes,
  CheckCircle2,
  Clock3,
  Cpu,
  Layers3,
  RadioTower,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAppData } from "@/state/use-app-data";
import type { ActionType, ExecutionState, ProcessOverview, WorkerFramework } from "@/types/entities";

const stateColors: Record<ExecutionState, string> = {
  running: "#22c55e",
  idle: "#3b82f6",
  stopping: "#f59e0b",
  failed: "#ef4444",
};

const frameworkLabels: Record<WorkerFramework, string> = {
  springboot: "Spring Boot",
  nodejs: "Node.js",
  python: "Python",
  unknown: "Unknown",
};

export function SummaryPage() {
  const {
    workers,
    processOverviews,
    executions,
    actions,
    pagination,
    status,
    lastUpdatedAt,
  } = useAppData();
  const stateSummary = countBy(processOverviews, (process) => process.currentState);
  const frameworkSummary = countBy(workers, (worker) => worker.framework);
  const activeProcesses = processOverviews.filter((process) => process.status === "active").length;
  const pendingCommands = processOverviews.filter(
    (process) => process.desiredToken > process.ackToken,
  ).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto pr-1">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Summary</h1>
          <p className="text-sm text-muted-foreground">
            Core activity, worker coverage, and process command health.
          </p>
        </div>
        <Badge variant={status === "error" ? "destructive" : "outline"} className="w-fit">
          {status === "ready" && lastUpdatedAt
            ? `Synced ${formatTime(lastUpdatedAt)}`
            : formatStatus(status)}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Workers"
          value={pagination.workers.totalItems}
          description={`${workers.length} loaded in state`}
          icon={Cpu}
        />
        <MetricCard
          title="Processes"
          value={pagination.processes.totalItems}
          description={`${activeProcesses} active in current page`}
          icon={Layers3}
        />
        <MetricCard
          title="Executions"
          value={pagination.executions.totalItems}
          description={`${executions.length} loaded in state`}
          icon={Activity}
        />
        <MetricCard
          title="Actions"
          value={pagination.actions.totalItems}
          description={`${actions.length} recent actions loaded`}
          icon={Boxes}
        />
      </div>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Process State</CardTitle>
            <CardDescription>Current process states from the loaded process page.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-[12rem_1fr] md:items-center">
            <StateDonut counts={stateSummary} total={processOverviews.length} />
            <div className="space-y-3">
              <StateRow label="Running" color="bg-green-500" value={stateSummary.running ?? 0} total={processOverviews.length} />
              <StateRow label="Idle" color="bg-blue-500" value={stateSummary.idle ?? 0} total={processOverviews.length} />
              <StateRow label="Stopping" color="bg-amber-500" value={stateSummary.stopping ?? 0} total={processOverviews.length} />
              <StateRow label="Failed" color="bg-red-500" value={stateSummary.failed ?? 0} total={processOverviews.length} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Worker Frameworks</CardTitle>
            <CardDescription>Framework mix for workers loaded in the current state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(frameworkLabels) as WorkerFramework[]).map((framework) => (
              <FrameworkRow
                key={framework}
                label={frameworkLabels[framework]}
                value={frameworkSummary[framework] ?? 0}
                total={workers.length}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Command Queue</CardTitle>
            <CardDescription>Processes waiting for workers to acknowledge desired tokens.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold">{pendingCommands}</div>
                <div className="text-sm text-muted-foreground">pending commands</div>
              </div>
              <RadioTower className="size-8 text-muted-foreground" />
            </div>
            <Progress value={percent(pendingCommands, Math.max(processOverviews.length, 1))} />
            <Separator />
            <div className="space-y-2">
              {processOverviews.slice(0, 4).map((process) => (
                <CommandRow key={process.id} process={process} />
              ))}
              {processOverviews.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No processes loaded yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
            <CardDescription>Latest action history loaded from the state snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actions.slice(0, 5).map((action) => (
              <div key={action.id} className="flex items-center justify-between gap-3 rounded-md bg-muted/35 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ActionIcon type={action.type} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{formatActionType(action.type)}</div>
                    <div className="text-xs text-muted-foreground">
                      Execution #{action.executionId} - {formatTime(action.createdAt)}
                    </div>
                  </div>
                </div>
                <Badge variant={action.status === "failed" ? "destructive" : "secondary"}>
                  {action.status}
                </Badge>
              </div>
            ))}
            {actions.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No actions loaded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-2 text-2xl">{value}</CardTitle>
        </div>
        <div className="rounded-md border bg-muted/40 p-2">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StateDonut({
  counts,
  total,
}: {
  counts: Partial<Record<ExecutionState, number>>;
  total: number;
}) {
  const running = percent(counts.running ?? 0, total);
  const idle = percent(counts.idle ?? 0, total);
  const stopping = percent(counts.stopping ?? 0, total);
  const background =
    total === 0
      ? "var(--muted)"
      : [
          `${stateColors.running} 0 ${running}%`,
          `${stateColors.idle} ${running}% ${running + idle}%`,
          `${stateColors.stopping} ${running + idle}% ${running + idle + stopping}%`,
          `${stateColors.failed} ${running + idle + stopping}% 100%`,
        ].join(", ");

  return (
    <div
      className="mx-auto grid size-44 place-items-center rounded-full"
      style={{ background: total === 0 ? background : `conic-gradient(${background})` }}
    >
      <div className="grid size-28 place-items-center rounded-full border bg-card text-center">
        <div>
          <div className="text-2xl font-semibold">{total}</div>
          <div className="text-xs text-muted-foreground">loaded</div>
        </div>
      </div>
    </div>
  );
}

function StateRow({
  label,
  color,
  value,
  total,
}: {
  label: string;
  color: string;
  value: number;
  total: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${color}`} />
          <span>{label}</span>
        </div>
        <span className="font-medium">{value}</span>
      </div>
      <Progress value={percent(value, total)} />
    </div>
  );
}

function FrameworkRow({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <Progress value={percent(value, total)} />
    </div>
  );
}

function CommandRow({ process }: { process: ProcessOverview }) {
  const pending = process.desiredToken > process.ackToken;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-muted/35 p-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{process.name}</div>
        <div className="text-xs text-muted-foreground">
          desired {process.desiredToken} - ack {process.ackToken}
        </div>
      </div>
      <Badge variant={pending ? "outline" : "secondary"}>
        {pending ? "waiting" : "synced"}
      </Badge>
    </div>
  );
}

function ActionIcon({ type }: { type: ActionType }) {
  const Icon = type === "ack" ? CheckCircle2 : type === "heartbeat" ? RadioTower : Clock3;
  return (
    <div className="rounded-md border bg-muted/40 p-2">
      <Icon className="size-4 text-muted-foreground" />
    </div>
  );
}

function countBy<T, K extends string>(items: T[], getKey: (item: T) => K) {
  return items.reduce<Partial<Record<K, number>>>((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function formatStatus(status: "idle" | "loading" | "ready" | "error") {
  if (status === "idle") return "Waiting for sync";
  if (status === "loading") return "Syncing";
  if (status === "error") return "Core unavailable";
  return "Synced";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function formatActionType(type: ActionType) {
  if (type === "ack") return "Acknowledged command";
  if (type === "heartbeat") return "Heartbeat received";
  if (type === "create") return "Execution created";
  if (type === "start") return "Start requested";
  return "Stop requested";
}

