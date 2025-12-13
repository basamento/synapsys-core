import { apiFetch } from "./client"

export type Neuron = {
  id: number
  name: string
  created_at: string
  last_connection: string
  status: "online" | "offline" 
  desired_state: "idle" | "running"
  last_state: "idle" | "running"
}

export function listNeurons() {
  return apiFetch<Neuron[]>("/api/neurons")
}

export function registerNeuron(name: string) {
  return apiFetch<Neuron>("/api/neurons", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export function startNeuron(id: number) {
  console.log("Starting neuron with ID:", id)
  return apiFetch<void>(`/api/neurons/${id}/start`, {
    method: "POST",
  })
}

