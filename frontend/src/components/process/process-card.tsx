import { formatDateTime } from "@/lib/utils";
import type { ExecutionState } from "@/types/entities";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import type { ProcessOverview } from "@/api/neurons";
import { StartNeuronButton } from "../neurons/start-neuron-button";
import { StopNeuronButton } from "../neurons/stop-neuron-button";

type WorkerCardProps = {
  worker: ProcessOverview;
};

export function ProcessCard({ worker }: WorkerCardProps) {
  return (
    <Card key={worker.id} className="p-4 transition-colors hover:bg-muted/40">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold truncate">{worker.name}</h2>

              <div className="flex items-center gap-2 flex-wrap">
                <TypeBadge type={worker.type} />
                <StatusBadge status={worker.status} />
                <StateBadge state={worker.currentState} />
              </div>
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              Worker:{" "}
              <span className="font-mono text-foreground/90">{worker.workerName}</span>
              {" - Host: "}
              <span className="font-mono text-foreground/90">{worker.host || "unknown"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <StartNeuronButton neuron={worker} />
            <StopNeuronButton neuron={worker} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Last Touch" value={formatDateTime(worker.lastTouch)} />
          <Metric label="Framework" value={formatFramework(worker.framework)} />
          <Metric label="Type" value={worker.type === "endless" ? "Endless" : "Progressive"} />
          <Metric label="State" value={formatState(worker.currentState)} />
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: "endless" | "progressive" }) {
  return (
    <Badge variant="secondary" className="whitespace-nowrap">
      {type === "endless" ? "Endless" : "Progressive"}
    </Badge>
  );
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  if (status === "active") {
    return (
      <Badge className="bg-green-600 text-white hover:bg-green-700 whitespace-nowrap">
        Active
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="whitespace-nowrap">
      Inactive
    </Badge>
  );
}

function StateBadge({ state }: { state: ExecutionState }) {
  if (state === "idle") {
    return (
      <Badge className="bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap">
        Idle
      </Badge>
    );
  }
  if (state === "running") {
    return (
      <Badge className="bg-violet-600 text-white hover:bg-violet-700 whitespace-nowrap">
        Running
      </Badge>
    );
  }
  if (state === "failed") {
    return (
      <Badge variant="destructive" className="whitespace-nowrap">
        Failed
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-600 text-white hover:bg-amber-700 whitespace-nowrap">
      Stopping
    </Badge>
  );
}

function formatState(state: ExecutionState) {
  if (state === "idle") return "Idle";
  if (state === "running") return "Running";
  if (state === "failed") return "Failed";
  return "Stopping";
}

function formatFramework(framework: ProcessOverview["framework"]) {
  if (framework === "springboot") return "Spring Boot";
  if (framework === "nodejs") return "Node.js";
  if (framework === "python") return "Python";
  return "Unknown";
}
