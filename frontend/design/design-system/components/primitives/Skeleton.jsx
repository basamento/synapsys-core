import React from "react";

export function Skeleton({ width = "100%", height = 12, radius = "var(--radius-xs)", style }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "linear-gradient(90deg, var(--surface-sunken) 25%, var(--chart-track) 50%, var(--surface-sunken) 75%)",
      backgroundSize: "200% 100%",
      animation: "cortex-shimmer 1.4s var(--ease-out) infinite",
      ...style,
    }} />
  );
}
