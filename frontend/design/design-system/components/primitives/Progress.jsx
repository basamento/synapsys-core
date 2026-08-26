import React from "react";

export function Progress({ value = 0, tone = "brand", height = 4, style }) {
  const fills = {
    brand: "var(--brand)", running: "var(--chart-running)", idle: "var(--chart-idle)",
    stopping: "var(--chart-stopping)", failed: "var(--chart-failed)",
  };
  return (
    <div style={{ height, background: "var(--chart-track)", borderRadius: "var(--radius-pill)", overflow: "hidden", ...style }}>
      <div style={{
        width: Math.max(0, Math.min(100, value)) + "%", height: "100%",
        background: fills[tone] || fills.brand, borderRadius: "var(--radius-pill)",
        transition: "width var(--dur-base) var(--ease-out)",
      }} />
    </div>
  );
}
