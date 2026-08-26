import { LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { MetricTile } from "@/components/cortex/metric-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EntityCard,
  EntityCardActions,
  EntityCardHead,
  EntityCardTiles,
} from "@/components/listing/entity-card";
import type { ListingDefinition } from "@/components/listing/listing-definition";
import { FRAMEWORKS, formatClock, formatCount, formatFramework } from "@/lib/format";
import type { Worker } from "@/types/entities";
import { MonoCell, NameCell } from "./name-cell";

export const workerListing: ListingDefinition<Worker> = {
  collection: "workers",
  title: "Workers",
  filterLabel: "Framework",
  filterOptions: FRAMEWORKS.map((framework) => ({
    value: framework,
    label: formatFramework(framework),
  })),
  getRowId: (worker) => worker.id,
  emptyMessage: "No workers yet.",

  columns: [
    {
      key: "name",
      header: "Worker",
      sortKey: "name",
      cell: (worker) => (
        <NameCell title={worker.name} identity={`#${worker.id} · ${worker.host}`} />
      ),
    },
    {
      key: "framework",
      secondary: true,
      header: "Framework",
      width: "124px",
      sortKey: "framework",
      cell: (worker) => <Badge variant="outline">{formatFramework(worker.framework)}</Badge>,
    },
    {
      key: "firstConnection",
      secondary: true,
      header: "First seen",
      width: "116px",
      sortKey: "firstConnection",
      cell: (worker) => <MonoCell>{formatClock(worker.firstConnection)}</MonoCell>,
    },
    {
      key: "lastConnection",
      secondary: true,
      header: "Last seen",
      width: "116px",
      sortKey: "lastConnection",
      cell: (worker) => <MonoCell>{formatClock(worker.lastConnection)}</MonoCell>,
    },
    {
      key: "processes",
      header: "Processes",
      width: "104px",
      sortKey: "processes",
      cell: (worker) => <MonoCell>{formatCount(worker.processCount)}</MonoCell>,
    },
    {
      key: "actions",
      header: "",
      width: "104px",
      align: "right",
      cell: () => (
        <Button asChild size="sm" variant="outline">
          <Link to="/processes">Processes</Link>
        </Button>
      ),
    },
  ],

  renderCard: (worker) => (
    <EntityCard>
      <EntityCardHead
        title={worker.name}
        subtitle={worker.host}
        pills={
          <>
            <Badge mono>#{worker.id}</Badge>
            <Badge variant="outline">{formatFramework(worker.framework)}</Badge>
          </>
        }
      />
      <EntityCardTiles>
        <MetricTile label="First connection" value={formatClock(worker.firstConnection)} mono />
        <MetricTile label="Last connection" value={formatClock(worker.lastConnection)} mono />
        <MetricTile label="Last touch" value={formatClock(worker.lastTouch)} mono />
        <MetricTile label="Processes" value={formatCount(worker.processCount)} />
      </EntityCardTiles>
      <EntityCardActions>
        <Button asChild size="lg" variant="outline">
          <Link to="/processes">
            <LoaderCircle aria-hidden className="text-muted-foreground" />
            View its processes
          </Link>
        </Button>
      </EntityCardActions>
    </EntityCard>
  ),
};
