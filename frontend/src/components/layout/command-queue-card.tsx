import { Card, CardBody } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { plural } from "@/lib/format";
import { useAppData } from "@/state/use-app-data";

/**
 * Under the nav: how many processes have been sent a command their worker has
 * not acknowledged yet. A process is waiting exactly when its desired token
 * has moved past its ack token.
 */
export function CommandQueueCard() {
  const { processOverviews } = useAppData();

  const pending = processOverviews.filter(
    (process) => process.desiredToken > process.ackToken,
  ).length;
  const percent =
    processOverviews.length > 0 ? (pending / processOverviews.length) * 100 : 0;

  return (
    <Card>
      <CardBody className="gap-2.5 p-3.75">
        <span className="type-eyebrow uppercase text-faint">Command queue</span>

        <div className="flex items-baseline gap-2">
          <span className="type-display-sm text-heading">{pending}</span>
          <span className="type-caption text-muted-foreground">pending</span>
        </div>

        <Progress value={percent} aria-label="Unacknowledged commands" />

        <p className="type-caption text-muted-foreground">{describe(pending)}</p>
      </CardBody>
    </Card>
  );
}

/** Flat and factual: state what the core reported and stop. */
function describe(pending: number) {
  if (pending === 0) return "Every worker has acknowledged its desired token.";
  return `${pending} ${plural(pending, "process")} on this page ${
    pending === 1 ? "is" : "are"
  } waiting for acknowledgement.`;
}
