import { useState } from "react";
import { Button } from "@/components/ui/button";
import { startNeuron, type Neuron } from "@/api/neurons";

type StartNeuronButtonProps = { neuron: Neuron };

export function StartNeuronButton({ neuron }: StartNeuronButtonProps) {
  const isActive = neuron.status === "active";
  const isRunning = neuron.currentState === "running";
  const inFlight = neuron.desiredToken > neuron.ackToken;

  // "I clicked start when desiredToken was X"
  const [pendingFromToken, setPendingFromToken] = useState<number | null>(null);
  const [requestFailed, setRequestFailed] = useState(false);

  // If we have a pending click, consider it resolved once:
  // - the neuron is running, OR
  // - the desiredToken changed (core accepted a new command), OR
  // - inFlight is true (command is pending on neuron side)
const pendingResolved =
  pendingFromToken === null ? true : neuron.desiredToken !== pendingFromToken;

  const isRequested = pendingFromToken !== null && !pendingResolved;

  async function handleClick() {
    if (!isActive || isRunning || inFlight || isRequested) return;

    setRequestFailed(false);
    setPendingFromToken(neuron.desiredToken);

    try {
      await startNeuron(neuron);
      // no state update needed here; UI will flip to Requested until next poll changes desiredToken / inFlight / running
    } catch (e) {
      setPendingFromToken(null);
      setRequestFailed(true);
      console.error("Failed to start neuron:", e);
    }
  }

  const disabled = !isActive || isRunning || inFlight || isRequested;

  let label = "Start";
  if (isRunning) label = "Running";
  else if (isRequested) label = "Requested";
  else if (inFlight) label = "Requested"; // optional: keep Requested while command is in flight
  // else Start

  return (
    <div>
      {/* {neuron.desiredToken} - {neuron.ackToken} {} */}
      <Button size="sm" variant="outline" onClick={handleClick} disabled={disabled}>
        {requestFailed ? "Retry" : label}
      </Button>
    </div>
  );
}

