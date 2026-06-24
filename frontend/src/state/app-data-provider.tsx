import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import {
  fetchAppDataSnapshot,
  type AppDataCollection,
  type AppDataPagination,
  type AppDataSnapshot,
  type PageInfo,
} from "@/api/app-data";
import {
  AppDataContext,
  emptyAppDataPagination,
  emptyAppDataSnapshot,
  type AppDataStatus,
  type PaginationUpdate,
} from "./app-data-context";

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AppDataSnapshot>(emptyAppDataSnapshot);
  const [pagination, setPagination] = useState<AppDataPagination>(emptyAppDataPagination);
  const paginationRef = useRef<AppDataPagination>(emptyAppDataPagination);
  const [status, setStatus] = useState<AppDataStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const fetchWithPagination = useCallback(async (activePagination: AppDataPagination) => {
    setStatus((current) => (current === "idle" ? "loading" : current));
    setError(null);

    try {
      const nextSnapshot = await fetchAppDataSnapshot(activePagination);
      setSnapshot(nextSnapshot);
      setPagination((current) => {
        paginationRef.current = nextSnapshot.pagination;
        return samePagination(current, nextSnapshot.pagination) ? current : nextSnapshot.pagination;
      });
      setStatus("ready");
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to refresh app data");
    }
  }, []);

  const refreshAppData = useCallback(() => {
    return fetchWithPagination(paginationRef.current);
  }, [fetchWithPagination]);

  const updatePagination = useCallback(
    (collection: AppDataCollection, update: PaginationUpdate) => {
      const currentPagination = paginationRef.current;
      const currentPage = currentPagination[collection];
      const nextPageSize = update.pageSize ?? currentPage.pageSize;
      const nextPage = update.page ?? (update.pageSize ? 1 : currentPage.page);
      const nextPagination = {
        ...currentPagination,
        [collection]: {
          ...currentPage,
          page: nextPage,
          pageSize: nextPageSize,
        },
      };

      if (samePagination(currentPagination, nextPagination)) {
        return;
      }

      paginationRef.current = nextPagination;
      setPagination(nextPagination);
      void fetchWithPagination(nextPagination);
    },
    [fetchWithPagination],
  );

  const value = useMemo(
    () => ({
      ...snapshot,
      pagination,
      status,
      error,
      lastUpdatedAt,
      refreshAppData,
      updatePagination,
    }),
    [error, lastUpdatedAt, pagination, refreshAppData, snapshot, status, updatePagination],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

function samePagination(left: AppDataPagination, right: AppDataPagination) {
  return (Object.keys(left) as AppDataCollection[]).every((collection) =>
    samePageInfo(left[collection], right[collection]),
  );
}

function samePageInfo(left: PageInfo, right: PageInfo) {
  return (
    left.page === right.page &&
    left.pageSize === right.pageSize &&
    left.totalItems === right.totalItems &&
    left.totalPages === right.totalPages
  );
}
