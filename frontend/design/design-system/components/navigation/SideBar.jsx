import React from "react";
import { Icon } from "../primitives/Icon.jsx";

export const CORTEX_NAV = [
  { key: "summary", label: "Summary", icon: "bar-chart-3" },
  { key: "workers", label: "Workers", icon: "pc-case" },
  { key: "processes", label: "Processes", icon: "loader-circle" },
  { key: "executions", label: "Executions", icon: "play-square" },
  { key: "actions", label: "Actions", icon: "history" },
];

export function SideBar({ items = CORTEX_NAV, active = "processes", counts = {}, label = "Monitor", footer, onSelect, style }) {
  return (
    <div style={{ width: "var(--sidebar-w)", flexShrink: 0, display: "flex", flexDirection: "column", gap: 3, ...style }}>
      <div style={{
        font: "var(--text-eyebrow)", letterSpacing: "var(--tracking-eyebrow)", textTransform: "uppercase",
        color: "var(--text-faint)", padding: "2px 12px 10px",
      }}>{label}</div>

      {items.map((item) => {
        const on = item.key === active;
        return (
          <div
            key={item.key}
            onClick={() => onSelect && onSelect(item.key)}
            style={{
              display: "flex", alignItems: "center", gap: 11, padding: "9px 12px",
              borderRadius: "var(--radius-sm)", cursor: "pointer",
              font: "var(--text-body-lg)", fontWeight: on ? 600 : 500,
              background: on ? "var(--brand)" : "transparent",
              color: on ? "var(--text-on-brand)" : "var(--text-body)",
              boxShadow: on ? "var(--shadow-brand)" : "none",
              transition: "background var(--dur-fast) var(--ease-out)",
            }}
          >
            <Icon name={item.icon} size={16} color={on ? "var(--text-on-brand)" : "var(--text-faint)"} strokeWidth={on ? 2 : 1.9} />
            {item.label}
            {counts[item.key] != null && (
              <span style={{
                marginLeft: "auto", font: "var(--text-mono-sm)",
                background: on ? "rgba(255,255,255,0.2)" : "var(--surface-sunken)",
                color: on ? "var(--text-on-brand)" : "var(--text-muted)",
                padding: "1px 7px", borderRadius: "var(--radius-xs)",
              }}>{counts[item.key]}</span>
            )}
          </div>
        );
      })}
      {footer && <div style={{ marginTop: 16 }}>{footer}</div>}
    </div>
  );
}
