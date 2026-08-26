import React from "react";
import { Badge } from "../primitives/Badge.jsx";

const LABEL = { idle: "idle", running: "running", stopping: "stopping", failed: "failed" };

export function StateBadge({ state = "idle", desired = false, dot = false, style }) {
  const label = LABEL[state] || state;
  return (
    <Badge tone={state} variant={desired ? "outline" : "soft"} dot={dot} style={style}>
      {desired ? "desired " + label : label}
    </Badge>
  );
}
