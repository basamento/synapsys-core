import React from "react";

const tones = {
  neutral: { bg: "var(--surface-sunken)", fg: "var(--text-body)", bd: "transparent" },
  brand: { bg: "var(--brand-soft)", fg: "var(--brand-soft-text)", bd: "transparent" },
  running: { bg: "var(--state-running-bg)", fg: "var(--state-running-fg)", bd: "transparent" },
  idle: { bg: "var(--state-idle-bg)", fg: "var(--state-idle-fg)", bd: "transparent" },
  stopping: { bg: "var(--state-stopping-bg)", fg: "var(--state-stopping-fg)", bd: "transparent" },
  failed: { bg: "var(--state-failed-bg)", fg: "var(--state-failed-fg)", bd: "transparent" },
};

export function Badge({ tone = "neutral", variant = "soft", dot = false, mono = false, style, children }) {
  const t = tones[tone] || tones.neutral;
  const outline = variant === "outline";
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, width: "fit-content",
        padding: outline ? "2px 10px" : "3px 10px",
        borderRadius: "var(--radius-pill)",
        background: outline ? "transparent" : t.bg,
        color: outline ? (tone === "brand" ? "var(--brand-soft-text)" : t.fg) : t.fg,
        border: outline ? "1px solid " + (tone === "brand" ? "var(--border-brand)" : "var(--border-strong)") : "1px solid " + t.bd,
        font: mono ? "var(--text-mono-sm)" : "var(--text-caption)",
        fontWeight: mono ? 400 : 600,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: "var(--radius-pill)", background: "currentColor" }} />}
      {children}
    </span>
  );
}
