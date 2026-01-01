import type { Neuron } from "@/api/neurons";
import { createContext } from "react";

export type NeuronsContextValue = {
  neurons: Neuron[];
  setNeurons: React.Dispatch<React.SetStateAction<Neuron[]>>;
  refreshNeurons: () => Promise<void>;
};

export const NeuronsContext = createContext<NeuronsContextValue | null>(null);
