import React from "react";

export function Card({ padded = true, raised = false, interactive = false, radius = "var(--radius-lg)", style, children }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={interactive ? () => setHover(true) : undefined}
      onMouseLeave={interactive ? () => setHover(false) : undefined}
      style={{
        background: hover ? "var(--surface-subtle)" : "var(--surface-card)",
        border: "1px solid var(--border)",
        borderRadius: radius,
        boxShadow: raised ? "var(--shadow-raised)" : "var(--shadow-card)",
        padding: padded ? "var(--card-pad)" : 0,
        transition: "background var(--dur-fast) var(--ease-out)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, aside, style }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, ...style }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        <div style={{ font: "var(--text-title)", color: "var(--text-heading)" }}>{title}</div>
        {description && <div style={{ font: "var(--text-body-sm)", color: "var(--text-muted)" }}>{description}</div>}
      </div>
      {aside}
    </div>
  );
}
