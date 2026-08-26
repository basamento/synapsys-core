import React from "react";
import { Icon } from "../primitives/Icon.jsx";
import { CORTEX_NAV } from "./SideBar.jsx";

export function TabBar({ items = CORTEX_NAV, active = "processes", onSelect, style }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(" + items.length + ", 1fr)",
      height: "var(--mobile-tabbar-h)", background: "var(--surface-card)",
      borderTop: "1px solid var(--border)", flexShrink: 0, ...style,
    }}>
      {items.map((item) => {
        const on = item.key === active;
        return (
          <div
            key={item.key}
            onClick={() => onSelect && onSelect(item.key)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
              minHeight: "var(--tap-min)", cursor: "pointer",
              color: on ? "var(--brand)" : "var(--text-faint)",
              font: "var(--text-eyebrow)", letterSpacing: "0.02em", textTransform: "none",
              fontWeight: on ? 600 : 500,
            }}
          >
            <Icon name={item.icon} size={19} color="currentColor" strokeWidth={on ? 2.1 : 1.8} />
            {item.label}
          </div>
        );
      })}
    </div>
  );
}
