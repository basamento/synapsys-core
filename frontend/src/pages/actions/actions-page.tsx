import { ActionCard } from "@/components/action/action-card";
import { ActionsHeader } from "@/components/layout/actions-header";
import { ListingPagination } from "@/components/listing/listing-pagination";
import { ListingShell } from "@/components/listing/listing-shell";
import { useAppData } from "@/state/use-app-data";

export function ActionsPage() {
  const { actions, status, error, pagination, updatePagination } = useAppData();
  const pageInfo = pagination.actions;

  return (
    <ListingShell
      header={<ActionsHeader total={pageInfo.totalItems} />}
      footer={
        <ListingPagination
          pageInfo={pageInfo}
          onPageChange={(page) => updatePagination("actions", { page })}
          onPageSizeChange={(pageSize) => updatePagination("actions", { pageSize })}
        />
      }
    >
      {actions.map((action) => (
        <ActionCard key={action.id} action={action} />
      ))}
      {status === "error" && (
        <div className="py-10 text-center text-sm text-destructive">
          {error ?? "Failed to load actions."}
        </div>
      )}
      {actions.length === 0 && status !== "error" && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          {status === "loading" ? "Loading actions..." : "No actions yet."}
        </div>
      )}
    </ListingShell>
  );
}
