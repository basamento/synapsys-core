import React from "react";
import { Progress } from "../primitives/Progress.jsx";

export function MeterRow({ label, value = 0, total = 0, tone = "brand", dot = false, showBar = true, style }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const dotColor = {
    running: "var(--chart-running)", idle: "var(--chart-idle)",
    stopping: "var(--chart-stopping)", failed: "var(--chart-failed)", brand: "var(--brand)",
  }[tone];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        {dot && <span style={{ width: 8, height: 8, borderRadius: "var(--radius-pill)", background: dotColor, flexShrink: 0 }} />}
        <span style={{ font: "var(--text-body-md)", color: "var(--text-body)", flexGrow: 1 }}>{label}</span>
        <span style={{ font: "var(--text-mono-md)", color: "var(--text-heading)" }}>{value}</span>
      </div>
      {showBar && <Progress value={pct} tone={tone} />}
    </div>
  );
}
