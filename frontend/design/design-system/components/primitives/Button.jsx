import React from "react";

const sizes = {
  sm: { height: 30, padding: "0 13px", font: "var(--text-body-sm)", radius: "var(--radius-sm)", gap: 6 },
  default: { height: 38, padding: "0 17px", font: "var(--text-body-md)", radius: "var(--radius-md)", gap: 8 },
  lg: { height: 44, padding: "0 22px", font: "var(--text-body-lg)", radius: "var(--radius-md)", gap: 9 },
  icon: { height: 32, width: 32, padding: 0, font: "var(--text-body-md)", radius: "var(--radius-sm)", gap: 0 },
  "icon-lg": { height: 38, width: 38, padding: 0, font: "var(--text-body-md)", radius: "var(--radius-md)", gap: 0 },
};

const variants = {
  default: { background: "var(--brand)", color: "var(--text-on-brand)", border: "1px solid transparent", boxShadow: "var(--shadow-brand)", weight: 600 },
  secondary: { background: "var(--surface-sunken)", color: "var(--text-body)", border: "1px solid transparent", weight: 600 },
  outline: { background: "var(--surface-card)", color: "var(--text-body)", border: "1px solid var(--border)", weight: 600 },
  ghost: { background: "transparent", color: "var(--text-body)", border: "1px solid transparent", weight: 500 },
  destructive: { background: "var(--state-failed-bg)", color: "var(--state-failed-fg)", border: "1px solid transparent", weight: 600 },
  link: { background: "transparent", color: "var(--brand)", border: "1px solid transparent", weight: 600, underline: true },
};

export function Button({
  variant = "default", size = "default", disabled = false, iconLeft, iconRight,
  onClick, type = "button", style, children,
}) {
  const s = sizes[size] || sizes.default;
  const v = variants[variant] || variants.default;
  const [hover, setHover] = React.useState(false);
  const lift = hover && !disabled;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: s.gap,
        height: s.height, width: s.width, padding: s.padding, borderRadius: s.radius,
        font: s.font, fontWeight: v.weight, letterSpacing: "0", whiteSpace: "nowrap",
        background: v.background, color: v.color, border: v.border, boxShadow: v.boxShadow,
        textDecoration: v.underline && hover ? "underline" : "none",
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        filter: lift ? "brightness(1.06)" : "none",
        transition: "filter var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)",
        ...style,
      }}
    >
      {iconLeft}{children}{iconRight}
    </button>
  );
}
