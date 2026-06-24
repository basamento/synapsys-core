import { apiFetch } from "@/api/client";
import type { Action, Execution, Process, ProcessOverview, Worker } from "@/types/entities";

export type AppDataCollection = "workers" | "processes" | "executions" | "actions";

export type PageInfo = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type AppDataPagination = Record<AppDataCollection, PageInfo>;

export type AppDataSnapshot = {
  workers: Worker[];
  processes: Process[];
  executions: Execution[];
  actions: Action[];
  pagination: AppDataPagination;
  processOverviews: ProcessOverview[];
};

type StateResponse = Omit<AppDataSnapshot, "processOverviews"> & {
  processOverviews?: ProcessOverview[];
};

export function createDefaultAppDataPagination(pageSize = 10): AppDataPagination {
  return {
    workers: createDefaultPageInfo(pageSize),
    processes: createDefaultPageInfo(pageSize),
    executions: createDefaultPageInfo(pageSize),
    actions: createDefaultPageInfo(pageSize),
  };
}

export async function fetchAppDataSnapshot(pagination: AppDataPagination): Promise<AppDataSnapshot> {
  if (import.meta.env.DEV) {
    console.debug("[state] fetching /api/state");
  }

  const state = await apiFetch<StateResponse>(
    `/api/state?${toStateSearchParams(pagination)}`,
  );

  if (import.meta.env.DEV) {
    console.debug("[state] snapshot received", {
      workers: state.workers.length,
      processes: state.processes.length,
      executions: state.executions.length,
      actions: state.actions.length,
      processOverviews: state.processOverviews?.length ?? 0,
    });
  }

  return {
    ...state,
    processOverviews:
      state.processOverviews ?? buildProcessOverviews(state.workers, state.processes, state.executions),
  };
}

function createDefaultPageInfo(pageSize: number): PageInfo {
  return {
    page: 1,
    pageSize,
    totalItems: 0,
    totalPages: 1,
  };
}

function toStateSearchParams(pagination: AppDataPagination) {
  const params = new URLSearchParams();

  Object.entries(pagination).forEach(([collection, page]) => {
    params.set(`${collection}Page`, String(page.page));
    params.set(`${collection}PageSize`, String(page.pageSize));
  });

  return params.toString();
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
