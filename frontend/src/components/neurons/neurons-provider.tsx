import { useCallback, useMemo, useState } from "react";
import { NeuronsContext } from "./neurons-context";
import { listNeurons, type Neuron } from "@/api/neurons";

export function NeuronsProvider({ children }: { children: React.ReactNode }) {
  const [neurons, setNeurons] = useState<Neuron[]>([]);

  const refreshNeurons = useCallback(async () => {
    const res = await listNeurons();
    console.log("Fetching neurons")
    setNeurons(res.neurons);
  }, []);

  const value = useMemo(
    () => ({ neurons, setNeurons, refreshNeurons }),
    [neurons, refreshNeurons]
  );

  return <NeuronsContext.Provider value={value}>{children}</NeuronsContext.Provider>;
}
