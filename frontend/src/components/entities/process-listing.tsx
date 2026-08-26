import { MetricTile } from "@/components/cortex/metric-tile";
import { StateBadge } from "@/components/cortex/state-badge";
import { STATE_DOT } from "@/components/cortex/tones";
import { Badge } from "@/components/ui/badge";
import {
  EntityCard,
  EntityCardActions,
  EntityCardHead,
  EntityCardTiles,
} from "@/components/listing/entity-card";
import type { ListingDefinition } from "@/components/listing/listing-definition";
import { EXECUTION_STATES, formatClock, formatFramework, formatProcessType } from "@/lib/format";
import type { ProcessOverview } from "@/types/entities";
import { MonoCell, NameCell, TextCell } from "./name-cell";
import { ProcessActions } from "./process-actions";

export const processListing: ListingDefinition<ProcessOverview> = {
  collection: "processes",
  title: "Processes",
  filterLabel: "State",
  filterOptions: EXECUTION_STATES.map((state) => ({
    value: state,
    label: state,
    dotClass: STATE_DOT[state],
  })),
  getRowId: (process) => process.id,
  emptyMessage: "No processes yet.",

  columns: [
    {
      key: "name",
      header: "Process",
      sortKey: "name",
      cell: (process) => <NameCell title={process.name} identity={process.workerName} />,
    },
    {
      key: "type",
      secondary: true,
      header: "Type",
      width: "112px",
      sortKey: "type",
      cell: (process) => <Badge variant="outline">{formatProcessType(process.type)}</Badge>,
    },
    {
      key: "state",
      header: "State",
      width: "116px",
      sortKey: "state",
      cell: (process) => <StateBadge state={process.currentState} />,
    },
    {
      key: "framework",
      secondary: true,
      header: "Framework",
      width: "124px",
      sortKey: "framework",
      cell: (process) => <TextCell>{formatFramework(process.framework)}</TextCell>,
    },
    {
      key: "lastTouch",
      secondary: true,
      header: "Last touch",
      width: "116px",
      sortKey: "lastTouch",
      cell: (process) => <MonoCell>{formatClock(process.lastTouch)}</MonoCell>,
    },
    {
      key: "actions",
      header: "Actions",
      width: "156px",
      align: "right",
      cell: (process) => <ProcessActions process={process} />,
    },
  ],

  renderCard: (process) => (
    <EntityCard>
      <EntityCardHead
        title={process.name}
        subtitle={`${process.workerName} · ${process.host || "unknown host"}`}
        pills={
          <>
            <Badge variant="outline">{formatProcessType(process.type)}</Badge>
            <StateBadge state={process.currentState} />
          </>
        }
      />
      <EntityCardTiles>
        <MetricTile label="Last touch" value={formatClock(process.lastTouch)} mono />
        <MetricTile
          label="Tokens"
          value={`${process.desiredToken} / ${process.ackToken}`}
          mono
        />
      </EntityCardTiles>
      <EntityCardActions>
        <ProcessActions process={process} size="lg" />
      </EntityCardActions>
    </EntityCard>
  ),
};
