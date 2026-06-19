import { formatDateTime } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import type { Neuron } from "@/api/neurons";
import { StartNeuronButton } from "./start-neuron-button";
import { StopNeuronButton } from "./stop-neuron-button";

type NeuronCardProps = {
  neuron: Neuron;
};

export function NeuronCard({ neuron }: NeuronCardProps) {
  return (
    <Card key={neuron.id} className="p-4 transition-colors hover:bg-muted/40">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold truncate">{neuron.name}</h2>

              <div className="flex items-center gap-2 flex-wrap">
                <TypeBadge type={neuron.type} />
                <StatusBadge status={neuron.status} />
                <StateBadge state={neuron.currentState} />
              </div>
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              Worker:{" "}
              <span className="font-mono text-foreground/90">{neuron.workerName}</span>
              {" - Host: "}
              <span className="font-mono text-foreground/90">{neuron.host}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <StartNeuronButton neuron={neuron} />
            <StopNeuronButton neuron={neuron} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Last Touch" value={formatDateTime(neuron.lastTouch)} />
          <Metric label="Framework" value={formatFramework(neuron.framework)} />
          <Metric label="Type" value={neuron.type === "endless" ? "Endless" : "Progressive"} />
          <Metric label="State" value={formatState(neuron.currentState)} />
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

function StateBadge({ state }: { state: "idle" | "running" | "stopping" }) {
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
  return (
    <Badge className="bg-amber-600 text-white hover:bg-amber-700 whitespace-nowrap">
      Stopping
    </Badge>
  );
}

function formatState(state: "idle" | "running" | "stopping") {
  if (state === "idle") return "Idle";
  if (state === "running") return "Running";
  return "Stopping";
}

function formatFramework(framework: Neuron["framework"]) {
  if (framework === "springboot") return "Spring Boot";
  if (framework === "nodejs") return "Node.js";
  if (framework === "python") return "Python";
  return "Unknown";
}
