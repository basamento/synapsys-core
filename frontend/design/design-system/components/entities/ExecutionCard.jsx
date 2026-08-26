import React from "react";
import { Badge } from "../primitives/Badge.jsx";
import { Card } from "../primitives/Card.jsx";
import { MetricTile } from "../monitor/MetricTile.jsx";
import { StateBadge } from "../monitor/StateBadge.jsx";

export function ExecutionCard({ execution, compact = false, style }) {
  const e = execution;
  return (
    <Card interactive padded={false} style={{ padding: compact ? "14px 14px 12px" : "15px 16px 14px", ...style }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{
          display: "flex", gap: 10, justifyContent: "space-between",
          alignItems: compact ? "flex-start" : "center", flexDirection: compact ? "column" : "row",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ font: "var(--text-title)", color: "var(--text-heading)" }}>Execution #{e.id}</span>
              <Badge tone={e.status === "active" ? "running" : "neutral"}>{e.status}</Badge>
              <StateBadge state={e.currentStatus} />
            </div>
            <div style={{ font: "var(--text-mono-sm)", color: "var(--text-faint)" }}>
              process #{e.processId}{e.runId != null ? " · run " + e.runId : ""}
            </div>
          </div>
          <StateBadge state={e.desiredState} desired />
        </div>

        <div style={{ display: "grid", gap: 9, gridTemplateColumns: compact ? "1fr 1fr" : "repeat(4, 1fr)" }}>
          <MetricTile label="Current" value={e.currentStatus} />
          <MetricTile label="Desired" value={e.desiredState} />
          <MetricTile label="Created" value={e.createdAt} mono />
          <MetricTile label="Modified" value={e.modifiedAt} mono />
        </div>
      </div>
    </Card>
  );
}
