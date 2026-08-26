import React from "react";

const MAP = {
  online: { label: "Core online", bg: "var(--state-running-bg)", fg: "var(--state-running-fg)", dot: "var(--state-running-dot)" },
  offline: { label: "Core offline", bg: "var(--state-failed-bg)", fg: "var(--state-failed-fg)", dot: "var(--state-failed-dot)" },
  checking: { label: "Checking core", bg: "var(--surface-sunken)", fg: "var(--text-muted)", dot: "var(--text-faint)" },
};

export function CoreStatusIndicator({ status = "online", compact = false, style }) {
  const s = MAP[status] || MAP.checking;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      background: s.bg, color: s.fg, font: "var(--text-caption)", fontWeight: 600,
      padding: compact ? "5px 10px" : "5px 12px 5px 10px", borderRadius: "var(--radius-pill)", ...style,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "var(--radius-pill)", background: s.dot,
        animation: status === "checking" ? "cortex-pulse 1.4s var(--ease-out) infinite" : "none",
      }} />
      {compact ? (status === "online" ? "Online" : status === "offline" ? "Offline" : "Checking") : s.label}
    </span>
  );
}
