import { apiFetch } from "./client"
import type { DesiredState, ProcessOverview } from "@/types/entities";

export type { ProcessOverview };

export type ListProcessOverviewsResponse = {
  processes: ProcessOverview[];
}

export async function listProcessOverviews() {
  const res = await apiFetch<ListProcessOverviewsResponse>("/api/processes");
  return { processOverviews: res.processes };
}

// Processes are addressed by id: names are only unique within a worker.
function setDesiredState(process: ProcessOverview, desiredState: DesiredState) {
  return apiFetch<void>(`/api/processes/${process.id}/desired-state`, {
    method: "PUT",
    body: JSON.stringify({ desiredState }),
  })
}

export function startProcess(process: ProcessOverview) {
  return setDesiredState(process, "running")
}

export function stopProcess(process: ProcessOverview) {
  return setDesiredState(process, "stopping")
}
