import React from "react";
import { Progress } from "../primitives/Progress.jsx";

export function SyncCountdown({ percent = 62, seconds = 4, label = "heartbeat", width = 124, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, width, ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", font: "var(--text-eyebrow)", color: "var(--text-faint)" }}>
        <span>{label}</span>
        <span style={{ font: "var(--text-mono-sm)", color: "var(--text-muted)" }}>{seconds}s</span>
      </div>
      <Progress value={percent} height={4} />
    </div>
  );
}
