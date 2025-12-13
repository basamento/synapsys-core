import { apiFetch } from "./client"

export type Neuron = {
  id: number
  name: string
  created_at: string
  last_connection: string
  status: "online" | "offline" 
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
