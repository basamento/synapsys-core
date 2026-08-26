import React from "react";

export function PageHeader({ title, meta, actions, compact = false, style }) {
  return (
    <div style={{
      display: "flex", alignItems: compact ? "flex-start" : "flex-end", justifyContent: "space-between",
      gap: compact ? 12 : 24, flexDirection: compact ? "column" : "row", ...style,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
        <div style={{
          font: compact ? "var(--text-display-sm)" : "var(--text-display)",
          letterSpacing: "var(--tracking-display)", color: "var(--text-heading)",
        }}>{title}</div>
        {meta && <div style={{ font: "var(--text-body-md)", color: "var(--text-muted)" }}>{meta}</div>}
      </div>
      {actions && <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}
