import { Button } from "@/components/ui/button"
import { stopNeuron, type Neuron } from "@/api/neurons"

type StopNeuronButtonProps = {
  neuron: Neuron
}

export function StopNeuronButton({ neuron }: StopNeuronButtonProps) {

  const isRunning = neuron.currentState === "running"
  const isActive = neuron.status === "active"
  const inFlight = neuron.desiredToken > neuron.ackToken
  const alreadyRequested = neuron.desiredState === "stopping"

  async function handleClick() {
    if (!isRunning || !isActive || inFlight || alreadyRequested) return
    await stopNeuron(neuron)
  }

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={handleClick}
      disabled={!isRunning || !isActive || inFlight || alreadyRequested}
    >
      {alreadyRequested || inFlight ? "Requested" : "Stop"}
    </Button>
  )
}

