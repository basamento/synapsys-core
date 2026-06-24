import { useCallback, useMemo, useState, type ReactNode } from "react";

import { fetchAppDataSnapshot, type AppDataSnapshot } from "@/api/app-data";
import {
  AppDataContext,
  emptyAppDataSnapshot,
  type AppDataStatus,
} from "./app-data-context";

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AppDataSnapshot>(emptyAppDataSnapshot);
  const [status, setStatus] = useState<AppDataStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const refreshAppData = useCallback(async () => {
    setStatus((current) => (current === "idle" ? "loading" : current));
    setError(null);

    try {
      const nextSnapshot = await fetchAppDataSnapshot();
      setSnapshot(nextSnapshot);
      setStatus("ready");
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to refresh app data");
    }
  }, []);

  const value = useMemo(
    () => ({
      ...snapshot,
      status,
      error,
      lastUpdatedAt,
      refreshAppData,
    }),
    [error, lastUpdatedAt, refreshAppData, snapshot, status],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
