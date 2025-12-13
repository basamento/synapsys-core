import { useEffect, useState } from "react"
import { listNeurons, type Neuron } from "@/api/neurons"

const REFRESH_INTERVAL = 1000 // ms

export function useNeurons() {

  const [data, setData] = useState<Neuron[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchNeurons = async () => {
      try {
        const result = await listNeurons()
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    // initial fetch
    fetchNeurons()
    // polling
    const interval = setInterval(fetchNeurons, REFRESH_INTERVAL)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return { data, loading, error }
}
