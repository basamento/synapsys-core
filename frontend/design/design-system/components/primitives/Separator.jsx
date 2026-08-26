import React from "react";

export function Separator({ orientation = "horizontal", style }) {
  const v = orientation === "vertical";
  return <div role="separator" style={{
    background: "var(--border)", flexShrink: 0,
    width: v ? 1 : "100%", height: v ? "100%" : 1, ...style,
  }} />;
}
