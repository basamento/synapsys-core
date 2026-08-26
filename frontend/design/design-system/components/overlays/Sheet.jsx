import React from "react";

export function Sheet({ open = true, side = "bottom", title, footer, onClose, height = "auto", children }) {
  if (!open) return null;
  const bottom = side === "bottom";
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(10, 12, 17, 0.5)" }} />
      <div style={{
        position: "absolute", left: bottom ? 0 : "auto", right: 0, bottom: 0, top: bottom ? "auto" : 0,
        width: bottom ? "100%" : 320, height: bottom ? height : "100%",
        background: "var(--surface-card)",
        borderTop: bottom ? "1px solid var(--border)" : "none",
        borderLeft: bottom ? "none" : "1px solid var(--border)",
        borderRadius: bottom ? "var(--radius-xl) var(--radius-xl) 0 0" : 0,
        boxShadow: "var(--shadow-overlay)", padding: "14px 16px 18px",
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        {bottom && <div style={{ width: 38, height: 4, borderRadius: "var(--radius-pill)", background: "var(--border-strong)", alignSelf: "center" }} />}
        {title && <div style={{ font: "var(--text-title)", color: "var(--text-heading)" }}>{title}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "auto" }}>{children}</div>
        {footer}
      </div>
    </div>
  );
}
