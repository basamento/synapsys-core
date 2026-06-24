import { apiFetch } from "@/api/client";
import type { Action, Execution, Process, ProcessOverview, Worker } from "@/types/entities";

export type AppDataSnapshot = {
  workers: Worker[];
  processes: Process[];
  executions: Execution[];
  actions: Action[];
  processOverviews: ProcessOverview[];
};

export async function fetchAppDataSnapshot(): Promise<AppDataSnapshot> {
  if (import.meta.env.DEV) {
    console.debug("[state] fetching /api/state");
  }

  const state = await apiFetch<Omit<AppDataSnapshot, "processOverviews">>("/api/state");

  if (import.meta.env.DEV) {
    console.debug("[state] snapshot received", {
      workers: state.workers.length,
      processes: state.processes.length,
      executions: state.executions.length,
      actions: state.actions.length,
    });
  }

  return {
    ...state,
    processOverviews: buildProcessOverviews(state.workers, state.processes, state.executions),
  };
}

function buildProcessOverviews(
  workers: Worker[],
  processes: Process[],
  executions: Execution[],
): ProcessOverview[] {
  const workerById = new Map(workers.map((worker) => [worker.id, worker]));
  const executionByProcessId = new Map(executions.map((execution) => [execution.processId, execution]));

  return processes.map((process) => {
    const worker = workerById.get(process.workerId);
    const execution = executionByProcessId.get(process.id);

    return {
      ...process,
      applicationName: worker?.name ?? "Unknown worker",
      workerName: worker?.name ?? "Unknown worker",
      framework: worker?.framework ?? "unknown",
      host: worker?.host ?? "",
      currentState: execution?.currentStatus ?? "idle",
      desiredState: execution?.desiredState ?? "idle",
      status: execution?.status ?? "inactive",
      lastTouch: worker?.lastTouch ?? process.createdAt,
    };
  });
}
