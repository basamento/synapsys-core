import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  fetchAppDataSnapshot,
  type AppDataCollection,
  type AppDataQuery,
  type AppDataSnapshot,
} from "@/api/app-data";
import {
  AppDataContext,
  POLL_INTERVAL_MS,
  defaultAppDataQuery,
  emptyAppDataSnapshot,
  type AppDataStatus,
  type QueryUpdate,
} from "./app-data-context";

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AppDataSnapshot>(emptyAppDataSnapshot);
  const [query, setQuery] = useState<AppDataQuery>(defaultAppDataQuery);
  const [status, setStatus] = useState<AppDataStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  // The poll fires from a timer that must not re-subscribe every time the query
  // changes, so the current query is mirrored into a ref for it to read.
  const queryRef = useRef<AppDataQuery>(defaultAppDataQuery);

  // At most one request is in flight, with at most one queued behind it, so a
  // slow core cannot pile up polls.
  const inFlight = useRef(false);
  const queued = useRef(false);

  const fetchWith = useCallback(async (activeQuery: AppDataQuery): Promise<void> => {
    if (inFlight.current) {
      queued.current = true;
      return;
    }

    inFlight.current = true;
    setStatus((current) => (current === "idle" ? "loading" : current));

    try {
      const nextSnapshot = await fetchAppDataSnapshot(activeQuery);
      setSnapshot(nextSnapshot);
      setStatus("ready");
      setError(null);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to refresh app data");
    } finally {
      inFlight.current = false;

      if (queued.current) {
        queued.current = false;
        // The queued run uses the latest query, not the one it was queued for.
        void fetchWith(queryRef.current);
      }
    }
  }, []);

  const refreshAppData = useCallback(() => fetchWith(queryRef.current), [fetchWith]);

  /**
   * The poll lives here rather than in the countdown that visualises it,
   * because it is how the console stays current — not a property of any one
   * widget. The mobile layout has no countdown, and must still receive data.
   */
  useEffect(() => {
    void fetchWith(queryRef.current);

    const id = setInterval(() => void fetchWith(queryRef.current), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchWith]);

  const updateQuery = useCallback(
    (collection: AppDataCollection, update: QueryUpdate) => {
      const current = queryRef.current[collection];

      // Anything that changes which rows match invalidates the current page:
      // staying on page 7 of a result set that just shrank to two pages would
      // show an empty table.
      const narrows =
        update.search !== undefined ||
        update.filters !== undefined ||
        update.pageSize !== undefined ||
        update.sortKey !== undefined ||
        update.sortDir !== undefined;

      const next = {
        ...current,
        ...update,
        page: update.page ?? (narrows ? 1 : current.page),
      };

      if (sameCollectionQuery(current, next)) {
        return;
      }

      const nextQuery = { ...queryRef.current, [collection]: next };
      queryRef.current = nextQuery;
      setQuery(nextQuery);
      void fetchWith(nextQuery);
    },
    [fetchWith],
  );

  const value = useMemo(
    () => ({
      ...snapshot,
      query,
      status,
      error,
      lastUpdatedAt,
      refreshAppData,
      updateQuery,
    }),
    [error, lastUpdatedAt, query, refreshAppData, snapshot, status, updateQuery],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

function sameCollectionQuery(
  left: AppDataQuery[AppDataCollection],
  right: AppDataQuery[AppDataCollection],
) {
  return (
    left.page === right.page &&
    left.pageSize === right.pageSize &&
    left.search === right.search &&
    left.sortKey === right.sortKey &&
    left.sortDir === right.sortDir &&
    left.filters.length === right.filters.length &&
    left.filters.every((filter, index) => filter === right.filters[index])
  );
}
