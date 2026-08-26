import React from "react";

export function Spinner({ size = 16, color = "var(--brand)", style }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      border: Math.max(2, Math.round(size / 8)) + "px solid var(--chart-track)",
      borderTopColor: color,
      animation: "cortex-spin 720ms linear infinite",
      ...style,
    }} />
  );
}
