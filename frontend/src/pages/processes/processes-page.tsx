import { ListingPagination } from "@/components/listing/listing-pagination";
import { ListingShell } from "@/components/listing/listing-shell";
import { ProcessesHeader } from "@/components/layout/processes-header";
import { ProcessCard } from "@/components/process/process-card";
import { useAppData } from "@/state/use-app-data";

export function ProcessesPage() {
  const { processOverviews, status, error, pagination, updatePagination } = useAppData();
  const pageInfo = pagination.processes;

  return (
    <ListingShell
      header={<ProcessesHeader total={pageInfo.totalItems} />}
      footer={
        <ListingPagination
          pageInfo={pageInfo}
          onPageChange={(page) => updatePagination("processes", { page })}
          onPageSizeChange={(pageSize) => updatePagination("processes", { pageSize })}
        />
      }
    >
      {processOverviews.map((process) => (
        <ProcessCard key={process.id} worker={process} />
      ))}
      {status === "error" && (
        <div className="py-10 text-center text-sm text-destructive">
          {error ?? "Failed to load processes."}
        </div>
      )}
      {processOverviews.length === 0 && status !== "error" && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          {status === "loading" ? "Loading processes..." : "No processes yet."}
        </div>
      )}
    </ListingShell>
  );
}
