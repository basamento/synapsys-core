import { createContext } from "react";

import type { AppDataSnapshot } from "@/api/app-data";

export type AppDataStatus = "idle" | "loading" | "ready" | "error";

export type AppDataContextValue = AppDataSnapshot & {
  status: AppDataStatus;
  error: string | null;
  lastUpdatedAt: string | null;
  refreshAppData: () => Promise<void>;
};

export const emptyAppDataSnapshot: AppDataSnapshot = {
  workers: [],
  processes: [],
  executions: [],
  actions: [],
  processOverviews: [],
};

export const AppDataContext = createContext<AppDataContextValue | null>(null);
