import React from "react";
import { Badge } from "../primitives/Badge.jsx";
import { Button } from "../primitives/Button.jsx";
import { Card } from "../primitives/Card.jsx";
import { MetricTile } from "../monitor/MetricTile.jsx";
import { StateBadge } from "../monitor/StateBadge.jsx";
import { formatFramework, formatType } from "./formatters.js";

export function ProcessCard({ process, compact = false, onStart, onStop, style }) {
  const p = process;
  const running = p.currentState === "running";
  const failed = p.currentState === "failed";
  const stopping = p.currentState === "stopping";

  return (
    <Card interactive padded={false} style={{ padding: compact ? "14px 14px 12px" : "15px 16px 14px", ...style }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{
          display: "flex", gap: 12, alignItems: compact ? "flex-start" : "center",
          justifyContent: "space-between", flexDirection: compact ? "column" : "row",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ font: "var(--text-title)", color: "var(--text-heading)" }}>{p.name}</span>
              <Badge variant="outline" tone="brand">{formatType(p.type)}</Badge>
              <StateBadge state={p.currentState} />
            </div>
            <div style={{ font: "var(--text-mono-sm)", color: "var(--text-faint)" }}>
              {p.workerName}{p.host ? " · " + p.host : ""}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexShrink: 0, width: compact ? "100%" : "auto" }}>
            <Button
              size={compact ? "lg" : "sm"}
              variant={running || stopping ? "outline" : "default"}
              disabled={running || stopping}
              onClick={onStart}
              style={compact ? { flex: 1 } : undefined}
            >
              {failed ? "Retry" : "Start"}
            </Button>
            <Button
              size={compact ? "lg" : "sm"}
              variant={running ? "destructive" : "outline"}
              disabled={!running}
              onClick={onStop}
              style={compact ? { flex: 1 } : undefined}
            >
              Stop
            </Button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 9, gridTemplateColumns: compact ? "1fr 1fr" : "repeat(4, 1fr)" }}>
          <MetricTile label="Last touch" value={p.lastTouch} mono />
          <MetricTile label="Framework" value={formatFramework(p.framework)} />
          <MetricTile label="Desired" value={p.desiredState} />
          <MetricTile label="Tokens" value={p.desiredToken + " / " + p.ackToken} mono />
        </div>
      </div>
    </Card>
  );
}
