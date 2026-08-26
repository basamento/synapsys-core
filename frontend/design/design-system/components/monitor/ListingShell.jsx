import React from "react";

export function ListingShell({ header, footer, gap = 16, style, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, minHeight: 0, flexGrow: 1, ...style }}>
      {header}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0, flexGrow: 1, overflow: "auto" }}>
        {children}
      </div>
      {footer}
    </div>
  );
}
