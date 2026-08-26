import { ActionStatusBadge } from "@/components/cortex/state-badge";
import { Badge } from "@/components/ui/badge";
import { EntityCard } from "@/components/listing/entity-card";
import type { ListingDefinition } from "@/components/listing/listing-definition";
import { ACTION_TYPES, formatActionType, formatClock } from "@/lib/format";
import type { Action } from "@/types/entities";
import { ActionIconSquare } from "./action-icon";
import { MonoCell, NameCell } from "./name-cell";

export const actionListing: ListingDefinition<Action> = {
  collection: "actions",
  title: "Actions",
  filterLabel: "Type",
  filterOptions: ACTION_TYPES.map((type) => ({ value: type, label: formatActionType(type) })),
  getRowId: (action) => action.id,
  emptyMessage: "No actions yet.",

  columns: [
    {
      key: "id",
      header: "Action",
      sortKey: "id",
      cell: (action) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <ActionIconSquare type={action.type} className="size-7" />
          <NameCell title={`Action #${action.id}`} identity={formatActionType(action.type)} />
        </div>
      ),
    },
    {
      key: "type",
      secondary: true,
      header: "Type",
      width: "132px",
      sortKey: "type",
      cell: (action) => <Badge variant="outline">{formatActionType(action.type)}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      width: "116px",
      sortKey: "status",
      cell: (action) => <ActionStatusBadge status={action.status} />,
    },
    {
      key: "execution",
      secondary: true,
      header: "Execution",
      width: "124px",
      sortKey: "execution",
      cell: (action) => <MonoCell>#{action.executionId}</MonoCell>,
    },
    {
      key: "createdAt",
      secondary: true,
      header: "Created",
      width: "124px",
      sortKey: "createdAt",
      cell: (action) => <MonoCell>{formatClock(action.createdAt)}</MonoCell>,
    },
  ],

  // An action is a single fact, so its card is one row rather than a stack.
  renderCard: (action) => (
    <EntityCard>
      <div className="flex items-center gap-2.75">
        <ActionIconSquare type={action.type} className="size-8.5" size={16} />
        <div className="flex min-w-0 grow flex-col gap-0.75">
          <span className="type-title text-heading">Action #{action.id}</span>
          <span className="truncate type-mono-sm text-faint">
            {formatActionType(action.type)} · execution #{action.executionId} ·{" "}
            {formatClock(action.createdAt)}
          </span>
        </div>
        <ActionStatusBadge status={action.status} />
      </div>
    </EntityCard>
  ),
};
