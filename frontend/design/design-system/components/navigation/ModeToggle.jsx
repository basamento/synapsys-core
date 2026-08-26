import React from "react";
import { Icon } from "../primitives/Icon.jsx";

export function ModeToggle({ theme = "light", onToggle, style }) {
  return (
    <span
      onClick={onToggle}
      role="button"
      style={{
        width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "var(--surface-card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)", cursor: "pointer", ...style,
      }}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={15} color="var(--text-muted)" />
    </span>
  );
}
