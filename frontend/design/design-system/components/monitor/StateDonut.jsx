import React from "react";

const ORDER = [
  ["running", "var(--chart-running)"],
  ["idle", "var(--chart-idle)"],
  ["stopping", "var(--chart-stopping)"],
  ["failed", "var(--chart-failed)"],
];

export function StateDonut({ counts = {}, total = 0, size = 104, caption = "loaded", style }) {
  let at = 0;
  const stops = total > 0
    ? ORDER.map(([k, c]) => {
        const from = at;
        at += ((counts[k] || 0) / total) * 100;
        return c + " " + from + "% " + at + "%";
      }).join(", ")
    : null;

  const inner = Math.round(size * 0.69);
  return (
    <div style={{
      width: size, height: size, borderRadius: "var(--radius-pill)", flexShrink: 0,
      display: "grid", placeItems: "center",
      background: stops ? "conic-gradient(" + stops + ")" : "var(--chart-track)", ...style,
    }}>
      <div style={{
        width: inner, height: inner, borderRadius: "var(--radius-pill)", background: "var(--surface-card)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ font: "var(--text-display-sm)", letterSpacing: "var(--tracking-display)", color: "var(--text-heading)" }}>{total}</span>
        <span style={{ font: "var(--text-eyebrow)", color: "var(--text-faint)" }}>{caption}</span>
      </div>
    </div>
  );
}
