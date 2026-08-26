import { executionListing } from "@/components/entities/execution-listing";
import { LogsModal } from "@/components/entities/logs-modal";
import { ListingView } from "@/components/listing/listing-view";
import { useAppData } from "@/state/use-app-data";
import { useState } from "react";
import type { Execution } from "@/types/entities";

export function ExecutionsPage() {
  const { executions } = useAppData();
  const [logsExecution, setLogsExecution] = useState<Execution | null>(null);
  return (
    <>
      <ListingView definition={executionListing(setLogsExecution)} rows={executions} />
      {logsExecution && <LogsModal execution={logsExecution} onClose={() => setLogsExecution(null)} />}
    </>
  );
}
