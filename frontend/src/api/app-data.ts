import { apiFetch } from "@/api/client";
import type { Action, Execution, Process, ProcessOverview, Worker } from "@/types/entities";

export type AppDataCollection = "workers" | "processes" | "executions" | "actions";

export const APP_DATA_COLLECTIONS: AppDataCollection[] = [
  "workers",
  "processes",
  "executions",
  "actions",
];

export type SortDirection = "asc" | "desc";

/**
 * Everything the console can ask of one listing. It mirrors the Go
 * CollectionQuery one-for-one: each field becomes a query parameter prefixed
 * with the collection name, so the four listings are paged, searched and
 * sorted independently inside a single /api/state request.
 *
 * `filters` carries the collection's one facet — state for processes,
 * framework for workers, status for executions, type for actions.
 */
export type CollectionQuery = {
  page: number;
  pageSize: number;
  search: string;
  filters: string[];
  sortKey: string;
  sortDir: SortDirection;
};

/** What the server reported about the page it returned. */
export type PageInfo = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type AppDataQuery = Record<AppDataCollection, CollectionQuery>;
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

/**
 * The facet parameter each collection uses, matching the Go CollectionSchemas.
 * A listing definition supplies the values; this names the parameter.
 */
const FILTER_PARAM: Record<AppDataCollection, string> = {
  workers: "Framework",
  processes: "State",
  executions: "Status",
  actions: "Type",
};

/** The server's default order for each collection, restated so the UI agrees. */
const DEFAULT_SORT: Record<AppDataCollection, { sortKey: string; sortDir: SortDirection }> = {
  workers: { sortKey: "lastConnection", sortDir: "desc" },
  processes: { sortKey: "lastTouch", sortDir: "desc" },
  executions: { sortKey: "id", sortDir: "desc" },
  actions: { sortKey: "createdAt", sortDir: "desc" },
};

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50];

/** Builds a value for each collection, keeping the record's keys exact. */
export function byCollection<T>(
  make: (collection: AppDataCollection) => T,
): Record<AppDataCollection, T> {
  return {
    workers: make("workers"),
    processes: make("processes"),
    executions: make("executions"),
    actions: make("actions"),
  };
}

export function createDefaultQuery(pageSize = DEFAULT_PAGE_SIZE): AppDataQuery {
  return byCollection((collection) => ({
    page: 1,
    pageSize,
    search: "",
    filters: [],
    ...DEFAULT_SORT[collection],
  }));
}

export function createDefaultPagination(pageSize = DEFAULT_PAGE_SIZE): AppDataPagination {
  return byCollection(() => ({ page: 1, pageSize, totalItems: 0, totalPages: 1 }));
}

/** True when a listing is narrowed, which is what the filter count badge shows. */
export function isNarrowed(query: CollectionQuery) {
  return query.search.trim() !== "" || query.filters.length > 0;
}

export async function fetchAppDataSnapshot(query: AppDataQuery): Promise<AppDataSnapshot> {
  const state = await apiFetch<StateResponse>(`/api/state?${toSearchParams(query)}`);

  return {
    ...state,
    processOverviews:
      state.processOverviews ??
      buildProcessOverviews(state.workers, state.processes, state.executions),
  };
}

function toSearchParams(query: AppDataQuery) {
  const params = new URLSearchParams();

  APP_DATA_COLLECTIONS.forEach((collection) => {
    const { page, pageSize, search, filters, sortKey, sortDir } = query[collection];

    params.set(`${collection}Page`, String(page));
    params.set(`${collection}PageSize`, String(pageSize));
    params.set(`${collection}Sort`, sortKey);
    params.set(`${collection}Dir`, sortDir);

    // Omitted rather than sent empty, so an untouched listing produces the
    // same URL it always did and stays cacheable.
    if (search.trim()) {
      params.set(`${collection}Search`, search.trim());
    }
    if (filters.length > 0) {
      params.set(`${collection}${FILTER_PARAM[collection]}`, filters.join(","));
    }
  });

  return params.toString();
}

/**
 * Fallback for a core that predates the joined process view. The server sends
 * processOverviews today; this keeps the console working against an older one.
 */
function buildProcessOverviews(
  workers: Worker[],
  processes: Process[],
  executions: Execution[],
): ProcessOverview[] {
  const workerById = new Map(workers.map((worker) => [worker.id, worker]));
  const executionByProcessId = new Map(
    executions.map((execution) => [execution.processId, execution]),
  );

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
