import React from "react";
import { Badge } from "../primitives/Badge.jsx";
import { Card } from "../primitives/Card.jsx";
import { MetricTile } from "../monitor/MetricTile.jsx";
import { formatFramework } from "./formatters.js";

export function WorkerCard({ worker, compact = false, style }) {
  const w = worker;
  return (
    <Card interactive padded={false} style={{ padding: compact ? "14px 14px 12px" : "15px 16px 14px", ...style }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ font: "var(--text-title)", color: "var(--text-heading)" }}>{w.name}</span>
            <Badge mono>#{w.id}</Badge>
            <Badge variant="outline" tone="brand">{formatFramework(w.framework)}</Badge>
          </div>
          <div style={{ font: "var(--text-mono-sm)", color: "var(--text-faint)" }}>{w.host}</div>
        </div>

        <div style={{ display: "grid", gap: 9, gridTemplateColumns: compact ? "1fr 1fr" : "repeat(4, 1fr)" }}>
          <MetricTile label="First connection" value={w.firstConnection} mono />
          <MetricTile label="Last connection" value={w.lastConnection} mono />
          <MetricTile label="Last touch" value={w.lastTouch} mono />
          <MetricTile label="Processes" value={w.processCount ?? "—"} />
        </div>
      </div>
    </Card>
  );
}
