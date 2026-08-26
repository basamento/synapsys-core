import React from "react";

export function Tooltip({ label, side = "bottom", children }) {
  const [show, setShow] = React.useState(false);
  const pos = side === "top" ? { bottom: "calc(100% + 7px)" } : { top: "calc(100% + 7px)" };
  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span style={{
          position: "absolute", ...pos, left: "50%", transform: "translateX(-50%)",
          background: "var(--surface-inverse)", color: "var(--canvas)",
          font: "var(--text-caption)", padding: "5px 9px", borderRadius: "var(--radius-sm)",
          whiteSpace: "nowrap", boxShadow: "var(--shadow-overlay)", zIndex: 70,
        }}>{label}</span>
      )}
    </span>
  );
}
