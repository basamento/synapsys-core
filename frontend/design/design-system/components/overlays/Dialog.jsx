import React from "react";
import { Button } from "../primitives/Button.jsx";

export function Dialog({ open = true, title, description, footer, width = 440, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: "absolute", inset: 0, display: "grid", placeItems: "center",
      background: "rgba(10, 12, 17, 0.5)", backdropFilter: "blur(3px)", padding: 20, zIndex: 60,
    }}>
      <div style={{
        width, maxWidth: "100%", background: "var(--surface-card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-overlay)", padding: "20px 22px 18px",
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ font: "var(--text-display-sm)", letterSpacing: "var(--tracking-tight)", color: "var(--text-heading)" }}>{title}</div>
            {description && <div style={{ font: "var(--text-body-md)", color: "var(--text-muted)" }}>{description}</div>}
          </div>
          {onClose && <Button size="icon" variant="ghost" onClick={onClose}>×</Button>}
        </div>
        {children}
        {footer && <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, paddingTop: 2 }}>{footer}</div>}
      </div>
    </div>
  );
}
