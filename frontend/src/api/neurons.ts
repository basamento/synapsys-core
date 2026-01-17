import { apiFetch } from "./client"

export type Neuron = {
  id: number;
  name: string;
  applicationName: string;
  type: "endless" | "progressive";
  currentState: "idle" | "running" | "stopping";
  desiredState: "idle" | "running" | "stopping";
  status: "active" | "inactive";
  lastTouch: string;
  pingTiming: number;
  desiredToken: number;
  ackToken: number;
  runId?: number | null;
};

export type ListNeuronsResponse = {
  neurons: Neuron[];
}

export function listNeurons() {
  return apiFetch<ListNeuronsResponse>("/api/neuron")
}

export function startNeuron(neuron: Neuron) {
  console.log("Starting neuron with ID:", neuron.id)
  return apiFetch<void>(`/api/neuron`, {
    method: "PUT",
    body: JSON.stringify({ neuronName: neuron.name, desiredState: "running" }),
  })
}

