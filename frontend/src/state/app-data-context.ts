import { createContext } from "react";

import {
  createDefaultAppDataPagination,
  type AppDataCollection,
  type AppDataPagination,
  type AppDataSnapshot,
} from "@/api/app-data";

export type AppDataStatus = "idle" | "loading" | "ready" | "error";

export type PaginationUpdate = {
  page?: number;
  pageSize?: number;
};

export type AppDataContextValue = AppDataSnapshot & {
  status: AppDataStatus;
  error: string | null;
  lastUpdatedAt: string | null;
  refreshAppData: () => Promise<void>;
  updatePagination: (collection: AppDataCollection, update: PaginationUpdate) => void;
};

export const emptyAppDataPagination: AppDataPagination = createDefaultAppDataPagination();

export const emptyAppDataSnapshot: AppDataSnapshot = {
  workers: [],
  processes: [],
  executions: [],
  actions: [],
  pagination: emptyAppDataPagination,
  processOverviews: [],
};

export const AppDataContext = createContext<AppDataContextValue | null>(null);
