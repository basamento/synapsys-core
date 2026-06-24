import { ListingPagination } from "@/components/listing/listing-pagination";
import { ListingShell } from "@/components/listing/listing-shell";
import { WorkersHeader } from "@/components/layout/workers-header";
import { WorkerCard } from "@/components/worker/worker-card";
import { useAppData } from "@/state/use-app-data";

export function WorkersPage() {
  const { workers, status, error, pagination, updatePagination } = useAppData();
  const pageInfo = pagination.workers;

  return (
    <ListingShell
      header={<WorkersHeader total={pageInfo.totalItems} />}
      footer={
        <ListingPagination
          pageInfo={pageInfo}
          onPageChange={(page) => updatePagination("workers", { page })}
          onPageSizeChange={(pageSize) => updatePagination("workers", { pageSize })}
        />
      }
    >
      {workers.map((worker) => (
        <WorkerCard key={worker.id} worker={worker} />
      ))}
      {status === "error" && (
        <div className="py-10 text-center text-sm text-destructive">
          {error ?? "Failed to load workers."}
        </div>
      )}
      {workers.length === 0 && status !== "error" && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          {status === "loading" ? "Loading workers..." : "No workers yet."}
        </div>
      )}
    </ListingShell>
  );
}
