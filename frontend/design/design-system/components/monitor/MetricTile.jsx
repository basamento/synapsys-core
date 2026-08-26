import React from "react";

export function MetricTile({ label, value, hint, icon, mono = false, style }) {
  return (
    <div style={{
      background: "var(--surface-subtle)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)", padding: "11px 13px",
      display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, ...style,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
        <span style={{
          font: "var(--text-eyebrow)", letterSpacing: "var(--tracking-eyebrow)",
          textTransform: "uppercase", color: "var(--text-faint)",
        }}>{label}</span>
        <span style={{
          font: mono ? "var(--text-mono-md)" : "var(--text-body-lg)", fontWeight: mono ? 400 : 600,
          color: "var(--text-heading)", overflowWrap: "anywhere",
        }}>{value}</span>
        {hint && <span style={{ font: "var(--text-caption)", color: "var(--text-muted)" }}>{hint}</span>}
      </div>
      {icon}
    </div>
  );
}
