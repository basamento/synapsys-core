import { MetricTile } from "@/components/cortex/metric-tile";
import {
  DesiredStateBadge,
  ExecutionStatusBadge,
  StateBadge,
} from "@/components/cortex/state-badge";
import { EntityCard, EntityCardHead, EntityCardTiles } from "@/components/listing/entity-card";
import type { ListingDefinition } from "@/components/listing/listing-definition";
import { formatClock } from "@/lib/format";
import type { Execution } from "@/types/entities";
import { MonoCell, NameCell } from "./name-cell";

/** How the core identifies a run, or just the process when none was started. */
function identityOf(execution: Execution) {
  return execution.runId
    ? `process #${execution.processId} · run ${execution.runId}`
    : `process #${execution.processId}`;
}

export const executionListing: ListingDefinition<Execution> = {
  collection: "executions",
  title: "Executions",
  filterLabel: "Status",
  filterOptions: [
    { value: "active", label: "active" },
    { value: "inactive", label: "inactive" },
  ],
  getRowId: (execution) => execution.id,
  emptyMessage: "No executions yet.",

  columns: [
    {
      key: "id",
      header: "Execution",
      sortKey: "id",
      cell: (execution) => (
        <NameCell title={`Execution #${execution.id}`} identity={identityOf(execution)} />
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "112px",
      sortKey: "status",
      cell: (execution) => <ExecutionStatusBadge status={execution.status} />,
    },
    {
      key: "current",
      header: "Current",
      width: "116px",
      sortKey: "current",
      cell: (execution) => <StateBadge state={execution.currentStatus} />,
    },
    {
      key: "desired",
      secondary: true,
      header: "Desired",
      width: "132px",
      sortKey: "desired",
      cell: (execution) => <DesiredStateBadge state={execution.desiredState} />,
    },
    {
      key: "createdAt",
      secondary: true,
      header: "Created",
      width: "112px",
      sortKey: "createdAt",
      cell: (execution) => <MonoCell>{formatClock(execution.createdAt)}</MonoCell>,
    },
    {
      key: "modifiedAt",
      secondary: true,
      header: "Modified",
      width: "112px",
      sortKey: "modifiedAt",
      cell: (execution) => <MonoCell>{formatClock(execution.modifiedAt)}</MonoCell>,
    },
  ],

  renderCard: (execution) => (
    <EntityCard>
      <EntityCardHead
        title={`Execution #${execution.id}`}
        subtitle={identityOf(execution)}
        pills={
          <>
            <ExecutionStatusBadge status={execution.status} />
            <StateBadge state={execution.currentStatus} />
          </>
        }
      />
      <EntityCardTiles>
        <MetricTile label="Desired" value={execution.desiredState} />
        <MetricTile label="Modified" value={formatClock(execution.modifiedAt)} mono />
      </EntityCardTiles>
    </EntityCard>
  ),
};
