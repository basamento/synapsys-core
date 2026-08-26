import { Activity, Boxes, Cpu, Layers3, RadioTower, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { MetricTile } from "@/components/cortex/metric-tile";
import { MeterRow } from "@/components/cortex/meter-row";
import { IconSquare, Panel, PanelRow } from "@/components/cortex/panel";
import { StateDonut } from "@/components/cortex/state-donut";
import { STATE_DISPLAY_ORDER } from "@/components/cortex/tones";
import { SyncBadge, ActionStatusBadge } from "@/components/cortex/state-badge";
import { ActionIcon } from "@/components/entities/action-icon";
import { PageHeader } from "@/components/listing/page-header";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-layout";
import {
  FRAMEWORKS,
  formatActionType,
  formatClock,
  formatFramework,
  formatRelative,
  metaLine,
  plural,
} from "@/lib/format";
import { useAppData } from "@/state/use-app-data";
import type { ExecutionState, WorkerFramework } from "@/types/entities";

/**
 * The one view that is not a listing. It answers, in order: how much is there,
 * what state is it in, what is the fleet made of, and what happened recently.
 *
 * Every count is either a server total (the whole collection) or a count over
 * the loaded page, and the copy says which — the core reports no aggregates
 * beyond totals, so none are invented here.
 */
export function SummaryPage() {
  const { workers, processOverviews, executions, actions, pagination, status, lastUpdatedAt } =
    useAppData();
  const isMobile = useIsMobile();

  const stateCounts = countBy(processOverviews, (process) => process.currentState);
  const frameworkCounts = countBy(workers, (worker) => worker.framework);
  const activeProcesses = processOverviews.filter(
    (process) => process.status === "active",
  ).length;
  const pending = processOverviews.filter(
    (process) => process.desiredToken > process.ackToken,
  ).length;

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4">
      <PageHeader
        title="Summary"
        // The desk view has room to say what the page covers; at 390px the
        // reader can see that for themselves, so it reports freshness only.
        meta={metaLine(
          isMobile
            ? status === "error"
              ? "Core offline"
              : "Core online"
            : "Core activity, worker coverage and command health",
          formatRelative(lastUpdatedAt),
        )}
        actions={
          !isMobile && (
            <Button variant="outline">
              <RefreshCw aria-hidden className="text-muted-foreground" />
              Synced {formatClock(lastUpdatedAt)}
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-2.5 wide:grid-cols-4 wide:gap-3.5">
        <CountTile
          label="Workers"
          total={pagination.workers.totalItems}
          hint={`${workers.length} loaded in state`}
          icon={Cpu}
        />
        <CountTile
          label="Processes"
          total={pagination.processes.totalItems}
          hint={`${activeProcesses} active on this page`}
          icon={Layers3}
        />
        <CountTile
          label="Executions"
          total={pagination.executions.totalItems}
          hint={`${executions.length} loaded in state`}
          icon={Activity}
        />
        <CountTile
          label="Actions"
          total={pagination.actions.totalItems}
          hint={`${actions.length} recent actions`}
          icon={Boxes}
        />
      </div>

      <div className="grid gap-3.5 wide:grid-cols-2 wide:gap-4">
        <Panel title="Process state" description="Current states from the loaded page.">
          <div className="flex items-center gap-4.5 wide:gap-6.5">
            <StateDonut
              counts={stateCounts}
              total={processOverviews.length}
              size={isMobile ? 92 : 104}
            />
            <div className="flex grow flex-col gap-2.25 wide:gap-2.75">
              {STATE_DISPLAY_ORDER.map((state) => (
                <MeterRow
                  key={state}
                  label={capitalise(state)}
                  value={stateCounts[state] ?? 0}
                  total={processOverviews.length}
                  tone={state}
                  dot
                  bar={false}
                />
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          title="Worker frameworks"
          description="Framework mix for workers in the current state."
        >
          <div className="flex flex-col gap-3">
            {FRAMEWORKS.map((framework) => (
              <MeterRow
                key={framework}
                label={formatFramework(framework)}
                value={frameworkCounts[framework] ?? 0}
                total={workers.length}
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-3.5 wide:grid-cols-2 wide:gap-4">
        <Panel
          title="Command queue"
          description="Processes waiting for workers to acknowledge desired tokens."
        >
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2.25">
              <span className="type-display text-heading">{pending}</span>
              <span className="type-body-md text-muted-foreground">
                pending {plural(pending, "command")}
              </span>
            </div>
            <RadioTower aria-hidden className="size-5.5 text-faint" />
          </div>

          <div className="flex flex-col gap-2">
            {processOverviews.slice(0, isMobile ? 3 : 4).map((process) => (
              <PanelRow key={process.id}>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate type-body-md font-semibold text-heading">
                    {process.name}
                  </span>
                  <span className="type-mono-sm text-faint">
                    desired {process.desiredToken} · ack {process.ackToken}
                  </span>
                </div>
                <SyncBadge pending={process.desiredToken > process.ackToken} />
              </PanelRow>
            ))}
            {processOverviews.length === 0 && <EmptyLine>No processes loaded yet.</EmptyLine>}
          </div>
        </Panel>

        <Panel title="Recent actions" description="Latest history from the state snapshot.">
          <div className="flex flex-col gap-2">
            {actions.slice(0, isMobile ? 4 : 5).map((action) => (
              <PanelRow key={action.id}>
                <IconSquare>
                  <ActionIcon type={action.type} size={15} />
                </IconSquare>
                <div className="flex min-w-0 grow flex-col gap-0.5">
                  <span className="truncate type-body-md font-semibold text-heading">
                    {formatActionType(action.type)}
                  </span>
                  <span className="truncate type-mono-sm text-faint">
                    execution #{action.executionId} · {formatClock(action.createdAt)}
                  </span>
                </div>
                <ActionStatusBadge status={action.status} />
              </PanelRow>
            ))}
            {actions.length === 0 && <EmptyLine>No actions loaded yet.</EmptyLine>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/** A collection total with the loaded-page fact underneath it. */
function CountTile({
  label,
  total,
  hint,
  icon: Icon,
}: {
  label: string;
  total: number;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <MetricTile
      label={label}
      value={total}
      hint={hint}
      icon={<Icon aria-hidden className="size-5 shrink-0 text-faint" />}
    />
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center type-body-md text-muted-foreground">{children}</p>;
}

function countBy<T, K extends string>(items: T[], keyOf: (item: T) => K) {
  return items.reduce<Partial<Record<K, number>>>((counts, item) => {
    const key = keyOf(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function capitalise(value: ExecutionState | WorkerFramework) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
