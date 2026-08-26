import { createContext } from "react";

import {
  createDefaultPagination,
  createDefaultQuery,
  type AppDataCollection,
  type AppDataQuery,
  type AppDataSnapshot,
  type CollectionQuery,
} from "@/api/app-data";

export type AppDataStatus = "idle" | "loading" | "ready" | "error";

/**
 * How often the console asks the core for a fresh snapshot. The heartbeat meter
 * in the top bar counts this interval down, so both read it from here.
 */
export const POLL_INTERVAL_MS = 5000;

/**
 * A partial change to one listing's query. Any change that alters *which* rows
 * match — a new search, a new filter, a new page size — sends the reader back
 * to page 1, because staying on page 7 of a result set that just shrank to two
 * pages shows an empty table.
 */
export type QueryUpdate = Partial<Omit<CollectionQuery, "page">> & { page?: number };

export type AppDataContextValue = AppDataSnapshot & {
  /** What the console asked for. */
  query: AppDataQuery;
  status: AppDataStatus;
  error: string | null;
  lastUpdatedAt: string | null;
  refreshAppData: () => Promise<void>;
  updateQuery: (collection: AppDataCollection, update: QueryUpdate) => void;
};

export const emptyAppDataSnapshot: AppDataSnapshot = {
  workers: [],
  processes: [],
  executions: [],
  actions: [],
  pagination: createDefaultPagination(),
  processOverviews: [],
};

export const defaultAppDataQuery = createDefaultQuery();

export const AppDataContext = createContext<AppDataContextValue | null>(null);
