import React from "react";

/** Nucleus — one soma, three axons, three terminals. 48-unit grid: ground r22, soma r6, terminal r4. */
export function Logo({ variant = "primary", size = 26, wordmark = false, product, style }) {
  const mark = {
    primary: (
      <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Synapsys">
        <circle cx="24" cy="24" r="22" fill="var(--brand)" />
        <path d="M24 24 24 9M24 24 36.99 31.5M24 24 11.01 31.5" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="24" cy="24" r="6" fill="#FFFFFF" />
        <circle cx="24" cy="9" r="4" fill="var(--teal-500)" />
        <circle cx="36.99" cy="31.5" r="4" fill="var(--teal-500)" />
        <circle cx="11.01" cy="31.5" r="4" fill="var(--teal-500)" />
      </svg>
    ),
    plain: (
      <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Synapsys">
        <path d="M24 24 24 9M24 24 36.99 31.5M24 24 11.01 31.5" fill="none" stroke="var(--brand)" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="24" cy="24" r="6" fill="var(--brand)" />
        <circle cx="24" cy="9" r="4" fill="var(--teal-500)" />
        <circle cx="36.99" cy="31.5" r="4" fill="var(--teal-500)" />
        <circle cx="11.01" cy="31.5" r="4" fill="var(--teal-500)" />
      </svg>
    ),
    mono: (
      <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Synapsys">
        <defs>
          <mask id="synapsys-knockout">
            <circle cx="24" cy="24" r="22" fill="#FFFFFF" />
            <path d="M24 24 24 9M24 24 36.99 31.5M24 24 11.01 31.5" fill="none" stroke="#000000" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="24" cy="24" r="6" fill="#000000" />
            <circle cx="24" cy="9" r="4" fill="#000000" />
            <circle cx="36.99" cy="31.5" r="4" fill="#000000" />
            <circle cx="11.01" cy="31.5" r="4" fill="#000000" />
          </mask>
        </defs>
        <circle cx="24" cy="24" r="22" fill="currentColor" mask="url(#synapsys-knockout)" />
      </svg>
    ),
    favicon: (
      <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Synapsys">
        <circle cx="24" cy="24" r="24" fill="var(--brand)" />
        <path d="M24 24 24 10.5M24 24 35.69 30.75M24 24 12.31 30.75" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="24" cy="24" r="7.5" fill="#FFFFFF" />
        <circle cx="24" cy="10.5" r="5.5" fill="var(--teal-500)" />
        <circle cx="35.69" cy="30.75" r="5.5" fill="var(--teal-500)" />
        <circle cx="12.31" cy="30.75" r="5.5" fill="var(--teal-500)" />
      </svg>
    ),
  }[variant];

  if (!wordmark) return <span style={{ display: "inline-flex", flexShrink: 0, ...style }}>{mark}</span>;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.42), minWidth: 0, ...style }}>
      {mark}
      <span style={{ display: "flex", alignItems: "baseline", gap: Math.round(size * 0.34), minWidth: 0 }}>
        <span style={{
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: Math.round(size * 0.68),
          letterSpacing: "-0.025em", color: "var(--text-heading)", whiteSpace: "nowrap",
        }}>Synapsys</span>
        {product && (
          <span style={{
            font: "var(--text-eyebrow)", letterSpacing: "var(--tracking-eyebrow)",
            textTransform: "uppercase", color: "var(--text-faint)",
          }}>{product}</span>
        )}
      </span>
    </span>
  );
}
