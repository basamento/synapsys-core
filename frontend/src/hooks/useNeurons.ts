import { useEffect, useState } from "react"
import { listNeurons } from "@/api/neurons"
import type { Neuron } from "@/api/neurons"

export function useNeurons() {
  const [data, setData] = useState<Neuron[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    listNeurons()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
