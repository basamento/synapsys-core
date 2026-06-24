import { useMemo } from "react";

import { useAppData } from "@/state/use-app-data";

export function useNeurons() {
  const { processOverviews, refreshAppData } = useAppData();

  return useMemo(
    () => ({
      neurons: processOverviews,
      refreshNeurons: refreshAppData,
    }),
    [processOverviews, refreshAppData],
  );
}
