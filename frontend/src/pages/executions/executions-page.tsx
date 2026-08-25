import { ExecutionCard } from "@/components/execution/execution-card";
import { ExecutionsHeader } from "@/components/layout/executions-header";
import { ListingPagination } from "@/components/listing/listing-pagination";
import { ListingShell } from "@/components/listing/listing-shell";
import { useAppData } from "@/state/use-app-data";

export function ExecutionsPage() {
  const { executions, status, error, pagination, updatePagination } = useAppData();
  const pageInfo = pagination.executions;

  return (
    <ListingShell
      header={<ExecutionsHeader total={pageInfo.totalItems} />}
      footer={
        <ListingPagination
          pageInfo={pageInfo}
          onPageChange={(page) => updatePagination("executions", { page })}
          onPageSizeChange={(pageSize) => updatePagination("executions", { pageSize })}
        />
      }
    >
      {executions.map((execution) => (
        <ExecutionCard key={execution.id} execution={execution} />
      ))}
      {status === "error" && (
        <div className="py-10 text-center text-sm text-destructive">
          {error ?? "Failed to load executions."}
        </div>
      )}
      {executions.length === 0 && status !== "error" && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          {status === "loading" ? "Loading executions..." : "No executions yet."}
        </div>
      )}
    </ListingShell>
  );
}
