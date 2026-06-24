import { apiFetch } from "./client"
import type { ExecutionState, ProcessOverview } from "@/types/entities";

export type { ProcessOverview };

export type ListProcessOverviewsResponse = {
  neurons: ProcessOverview[];
}

export async function listProcessOverviews() {
  const res = await apiFetch<ListProcessOverviewsResponse>("/api/neuron");
  return { processOverviews: res.neurons };
}

export function startNeuron(process: ProcessOverview) {
  console.log("Starting process with ID:", process.id)
  return apiFetch<void>(`/api/neuron`, {
    method: "PUT",
    body: JSON.stringify({ neuronName: process.name, desiredState: "running" satisfies ExecutionState }),
  })
}

export function stopNeuron(process: ProcessOverview) {
  console.log("Stopping process with ID:", process.id)
  return apiFetch<void>(`/api/neuron`, {
    method: "PUT",
    body: JSON.stringify({ neuronName: process.name, desiredState: "stopping" satisfies ExecutionState }),
  })
}
