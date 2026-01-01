import { useContext } from "react";
import { NeuronsContext } from "./neurons-context";

export function useNeurons() {
  const ctx = useContext(NeuronsContext);
  if (!ctx) throw new Error("useNeurons must be used within NeuronsProvider");
  return ctx;
}
