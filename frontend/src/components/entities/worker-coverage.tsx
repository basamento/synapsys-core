import { MetricTile } from "@/components/cortex/metric-tile";
import { Panel } from "@/components/cortex/panel";
import { formatClock, formatGap, plural } from "@/lib/format";
import type { Worker } from "@/types/entities";

/**
 * Sits under the Workers table and answers the question the table cannot: how
 * fresh is this connection. With a single worker it reports that worker; with
 * several it reports the fleet's oldest and newest edges, because the useful
 * fact is the worst gap, not an average.
 */
export function WorkerCoverage({ workers }: { workers: Worker[] }) {
  if (workers.length === 0) return null;

  const single = workers.length === 1 ? workers[0] : null;
  const firstConnection = earliest(workers.map((worker) => worker.firstConnection));
  const lastTouch = latest(workers.map((worker) => worker.lastTouch));

  return (
    <Panel
      title="Coverage"
      description={
        single
          ? "One worker is answering. Every process on this page belongs to it."
          : `${workers.length} ${plural(workers.length, "worker")} on this page.`
      }
    >
      <div className="grid grid-cols-2 gap-2.5 wide:grid-cols-4">
        <MetricTile
          label="Host"
          value={single ? single.host : `${workers.length} hosts`}
          mono={Boolean(single)}
        />
        <MetricTile label="First connection" value={formatClock(firstConnection)} mono />
        <MetricTile label="Last touch" value={formatClock(lastTouch)} mono />
        <MetricTile label="Heartbeat gap" value={formatGap(lastTouch)} mono />
      </div>
    </Panel>
  );
}

function earliest(values: string[]) {
  return values.reduce((soonest, value) => (value < soonest ? value : soonest));
}

function latest(values: string[]) {
  return values.reduce((newest, value) => (value > newest ? value : newest));
}
