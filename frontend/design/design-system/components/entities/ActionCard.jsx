import React from "react";
import { Badge } from "../primitives/Badge.jsx";
import { Card } from "../primitives/Card.jsx";
import { Icon } from "../primitives/Icon.jsx";
import { MetricTile } from "../monitor/MetricTile.jsx";
import { formatActionType } from "./formatters.js";

const ICONS = { ack: "check-circle-2", heartbeat: "radio-tower", create: "plus-circle", start: "play", stop: "square" };
const TONES = { done: "running", waiting: "stopping", failed: "failed" };

export function ActionCard({ action, compact = false, dense = false, style }) {
  const a = action;
  const icon = (
    <span style={{
      width: 30, height: 30, borderRadius: "var(--radius-sm)", background: "var(--surface-sunken)",
      border: "1px solid var(--border)", display: "grid", placeItems: "center", flexShrink: 0,
    }}>
      <Icon name={ICONS[a.type] || "clock-3"} size={15} color="var(--text-muted)" />
    </span>
  );

  if (dense) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 11, padding: "10px 12px",
        background: "var(--surface-subtle)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)", ...style,
      }}>
        {icon}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flexGrow: 1 }}>
          <span style={{ font: "var(--text-body-md)", fontWeight: 600, color: "var(--text-heading)" }}>{formatActionType(a.type)}</span>
          <span style={{ font: "var(--text-mono-sm)", color: "var(--text-faint)" }}>execution #{a.executionId} · {a.createdAt}</span>
        </div>
        <Badge tone={TONES[a.status]}>{a.status}</Badge>
      </div>
    );
  }

  return (
    <Card interactive padded={false} style={{ padding: compact ? "14px 14px 12px" : "15px 16px 14px", ...style }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          {icon}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flexGrow: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ font: "var(--text-title)", color: "var(--text-heading)" }}>Action #{a.id}</span>
              <Badge variant="outline" tone="brand">{formatActionType(a.type)}</Badge>
            </div>
            <span style={{ font: "var(--text-mono-sm)", color: "var(--text-faint)" }}>execution #{a.executionId}</span>
          </div>
          <Badge tone={TONES[a.status]}>{a.status}</Badge>
        </div>

        <div style={{ display: "grid", gap: 9, gridTemplateColumns: compact ? "1fr 1fr" : "repeat(3, 1fr)" }}>
          <MetricTile label="Type" value={formatActionType(a.type)} />
          <MetricTile label="Status" value={a.status} />
          <MetricTile label="Created" value={a.createdAt} mono />
        </div>
      </div>
    </Card>
  );
}
