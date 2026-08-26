import React from "react";

export function Input({ value, placeholder, iconLeft, trailing, size = "default", readOnly, onChange, style }) {
  const [focus, setFocus] = React.useState(false);
  const h = size === "lg" ? 44 : size === "sm" ? 32 : 38;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9, height: h, padding: "0 13px",
      background: "var(--surface-card)",
      border: "1px solid " + (focus ? "var(--brand)" : "var(--border)"),
      borderRadius: "var(--radius-md)",
      boxShadow: focus ? "0 0 0 3px var(--focus-ring)" : "none",
      transition: "border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
      ...style,
    }}>
      {iconLeft}
      <input
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent",
          font: "var(--text-body-md)", color: "var(--text-heading)",
        }}
      />
      {trailing}
    </div>
  );
}
