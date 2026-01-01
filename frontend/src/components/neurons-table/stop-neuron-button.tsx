import { Button } from "@/components/ui/button"
import { startNeuron, type Neuron } from "@/api/neurons"

type StopNeuronButtonProps = {
  neuron: Neuron
}

export function StopNeuronButton({ neuron }: StopNeuronButtonProps) {

  const isRunning = neuron.currentState === "running"
  const isActive = neuron.status === "active"
  const alreadyRequested = neuron.desiredState === "running"

  // async function handleClick() {
  //   if (isRunning) return
  //   const response = await startNeuron(neuron)
  //   console.log("Neuron started:", response)
  // }

  return (
    <Button
      size="sm"
      variant="destructive"
      // onClick={handleClick}
      disabled={isRunning || !isActive || alreadyRequested}
    >
      Stop
    </Button>
  )
}

