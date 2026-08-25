import { apiFetch } from "./client"
import type { DesiredState, ProcessOverview } from "@/types/entities";

export type { ProcessOverview };

export type ListProcessOverviewsResponse = {
  neurons: ProcessOverview[];
}

export async function listProcessOverviews() {
  const res = await apiFetch<ListProcessOverviewsResponse>("/api/neuron");
  return { processOverviews: res.neurons };
}

// Processes are addressed by id: names are only unique within a worker.
function setDesiredState(process: ProcessOverview, desiredState: DesiredState) {
  return apiFetch<void>(`/api/processes/${process.id}/desired-state`, {
    method: "PUT",
    body: JSON.stringify({ desiredState }),
  })
}

export function startNeuron(process: ProcessOverview) {
  return setDesiredState(process, "running")
}

export function stopNeuron(process: ProcessOverview) {
  return setDesiredState(process, "stopping")
}
