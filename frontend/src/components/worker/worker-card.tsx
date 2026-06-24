import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { Worker } from "@/types/entities";

type WorkerCardProps = {
  worker: Worker;
};

export function WorkerCard({ worker }: WorkerCardProps) {
  return (
    <Card className="p-4 transition-colors hover:bg-muted/40">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold">{worker.name}</h2>
              <Badge variant="secondary">#{worker.id}</Badge>
              <FrameworkBadge framework={worker.framework} />
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              Host: <span className="font-mono text-foreground/90 break-all">{worker.host}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="First Connection" value={formatDateTime(worker.firstConnection)} />
          <Metric label="Last Connection" value={formatDateTime(worker.lastConnection)} />
          <Metric label="Last Touch" value={formatDateTime(worker.lastTouch)} />
          <Metric label="Framework" value={formatFramework(worker.framework)} />
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

function FrameworkBadge({ framework }: { framework: Worker["framework"] }) {
  return (
    <Badge variant="outline" className="whitespace-nowrap">
      {formatFramework(framework)}
    </Badge>
  );
}

function formatFramework(framework: Worker["framework"]) {
  if (framework === "springboot") return "Spring Boot";
  if (framework === "nodejs") return "Node.js";
  if (framework === "python") return "Python";
  return "Unknown";
}
