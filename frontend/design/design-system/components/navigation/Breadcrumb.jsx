import React from "react";
import { Icon } from "../primitives/Icon.jsx";

export function Breadcrumb({ items = [], style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, font: "var(--text-body-sm)", color: "var(--text-muted)", ...style }}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <Icon name="chevron-right" size={13} color="var(--text-faint)" />}
          <span style={{
            color: i === items.length - 1 ? "var(--text-heading)" : "var(--text-muted)",
            fontWeight: i === items.length - 1 ? 600 : 500,
            cursor: i === items.length - 1 ? "default" : "pointer",
          }}>{item.label}</span>
        </React.Fragment>
      ))}
    </div>
  );
}
