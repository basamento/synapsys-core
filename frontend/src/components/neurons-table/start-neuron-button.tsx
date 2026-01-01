import { Button } from "@/components/ui/button"
import { startNeuron, type Neuron } from "@/api/neurons"

type StartNeuronButtonProps = {
  neuron: Neuron
}

export function StartNeuronButton({ neuron }: StartNeuronButtonProps) {

  const isRunning = neuron.currentState === "running"
  const isActive = neuron.status === "active"
  const alreadyRequested = neuron.desiredState === "running"

  async function handleClick() {
    if (isRunning) return
    const response = await startNeuron(neuron)
    console.log("Neuron started:", response)
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={isRunning || !isActive || alreadyRequested}
    >
      {alreadyRequested ? "Requested" : "Start"}
    </Button>
  )
}

