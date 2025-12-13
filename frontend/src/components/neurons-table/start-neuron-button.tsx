import { Button } from "@/components/ui/button"
import { startNeuron, type Neuron } from "@/api/neurons"

type StartNeuronButtonProps = {
  neuron: Neuron
}

export function StartNeuronButton({ neuron }: StartNeuronButtonProps) {

  const isRunning = neuron.desired_state === "running"

  async function handleClick() {
    if (isRunning) return
    await startNeuron(neuron.id)
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={isRunning}
    >
      Start
    </Button>
  )
}

