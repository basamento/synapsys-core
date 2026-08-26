import { useState } from "react";

import { startNeuron, stopNeuron } from "@/api/neurons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-layout";
import { useAppData } from "@/state/use-app-data";
import type { ProcessOverview } from "@/types/entities";

/**
 * Start and Stop for one process.
 *
 * Which button is live follows the observed state, and both are always
 * rendered so a row's controls never shift as the state changes underneath:
 *
 *   idle      brand Start,  Stop disabled
 *   running   Start disabled, destructive Stop
 *   stopping  both disabled — the command is already in flight
 *   failed    brand Retry,  Stop disabled
 *
 * On top of that, both are disabled when the process's worker has gone quiet.
 * `status` is not a property of the execution: the core derives it by comparing
 * the worker's last touch against the process's ping window, so "inactive"
 * means nobody is listening. The core would accept the command and the process
 * would sit unacknowledged forever, so the reason is offered in a tooltip
 * instead.
 *
 * A command is optimistic: both buttons disable the moment one is pressed and
 * stay disabled until a poll shows the core moved the desired token.
 */
export function ProcessActions({
  process,
  size = "sm",
}: {
  process: ProcessOverview;
  size?: "sm" | "lg";
}) {
  const { refreshAppData } = useAppData();
  const isMobile = useIsMobile();

  const [confirmStop, setConfirmStop] = useState(false);

  // The command that was sent, remembered with the desired token as it stood at
  // the time. The core moving past that token *is* the acknowledgement, so
  // whether a command is still in flight is derived rather than cleared by an
  // effect — the next poll resolves it on its own.
  const [sent, setSent] = useState<{ command: "start" | "stop"; atToken: number } | null>(null);
  const inFlight = sent && process.desiredToken === sent.atToken ? sent.command : null;

  const answering = process.status === "active";
  const running = process.currentState === "running";
  const stopping = process.currentState === "stopping";
  const failed = process.currentState === "failed";
  const unacknowledged = process.desiredToken > process.ackToken;

  const busy = inFlight !== null || stopping || unacknowledged;
  const canStart = answering && !running && !busy;
  const canStop = answering && running && !busy;

  async function send(command: "start" | "stop") {
    setSent({ command, atToken: process.desiredToken });

    try {
      await (command === "start" ? startNeuron(process) : stopNeuron(process));
      // Pull the new state now rather than waiting out the rest of the poll.
      await refreshAppData();
    } catch {
      // The core rejected it, so let the operator try again immediately. The
      // next poll reports whatever actually happened.
      setSent(null);
    }
  }

  function requestStop() {
    // On a small screen Stop is easy to hit by accident, so it is confirmed.
    // Start never is — it is cheap to undo.
    if (isMobile) {
      setConfirmStop(true);
    } else {
      void send("stop");
    }
  }

  const buttons = (
    <div className={size === "lg" ? "flex flex-1 gap-2.25" : "flex gap-1.75"}>
      <Button
        size={size}
        variant={canStart ? "default" : "outline"}
        disabled={!canStart}
        onClick={() => void send("start")}
        className={size === "lg" ? "flex-1" : undefined}
      >
        {inFlight === "start" && <Spinner />}
        {failed ? "Retry" : "Start"}
      </Button>

      <Button
        size={size}
        variant={canStop ? "destructive" : "outline"}
        disabled={!canStop}
        onClick={requestStop}
        className={size === "lg" ? "flex-1" : undefined}
      >
        {inFlight === "stop" && <Spinner />}
        Stop
      </Button>
    </div>
  );

  return (
    <>
      {answering ? (
        buttons
      ) : (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            {/* Disabled controls swallow pointer events, so the reason hangs
                off a wrapper the pointer can still reach. */}
            <TooltipTrigger asChild>
              <div className={size === "lg" ? "flex flex-1" : "flex"}>{buttons}</div>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>
              {process.workerName} has not answered within its ping window.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <Dialog open={confirmStop} onOpenChange={setConfirmStop}>
        <DialogContent>
          <div className="flex flex-col gap-1.25">
            <DialogTitle>Stop {process.name}?</DialogTitle>
            <DialogDescription>
              The worker acknowledges within one heartbeat. The process keeps its run id.
            </DialogDescription>
          </div>
          <DialogActions>
            <Button size="lg" variant="outline" onClick={() => setConfirmStop(false)}>
              Cancel
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={() => {
                setConfirmStop(false);
                void send("stop");
              }}
            >
              Stop
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </>
  );
}
