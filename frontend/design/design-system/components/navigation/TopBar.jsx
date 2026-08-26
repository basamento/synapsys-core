import React from "react";
import { Icon } from "../primitives/Icon.jsx";
import { Logo } from "../primitives/Logo.jsx";
import { CoreStatusIndicator } from "../monitor/CoreStatusIndicator.jsx";
import { SyncCountdown } from "../monitor/SyncCountdown.jsx";
import { ModeToggle } from "./ModeToggle.jsx";

export function TopBar({
  product = "Cortex", status = "online", syncPercent = 62, syncSeconds = 4,
  theme = "light", onToggleTheme, initials = "SU", compact = false, onMenu,
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: compact ? 54 : "var(--topbar-h)", padding: compact ? "0 14px" : "0 var(--shell-pad-x)",
      background: "var(--surface-card)", borderBottom: "1px solid var(--border)", flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {compact && onMenu && (
          <span onClick={onMenu} style={{ display: "inline-flex", padding: 4, cursor: "pointer" }}>
            <Icon name="menu" size={19} color="var(--text-body)" />
          </span>
        )}
        <Logo wordmark product={product} size={25} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: compact ? 9 : 14 }}>
        <CoreStatusIndicator status={status} compact={compact} />
        {!compact && <SyncCountdown percent={syncPercent} seconds={syncSeconds} />}
        <ModeToggle theme={theme} onToggle={onToggleTheme} />
        {!compact && (
          <span style={{
            width: 32, height: 32, borderRadius: "var(--radius-pill)", background: "var(--brand-soft)",
            color: "var(--brand-soft-text)", font: "var(--text-caption)", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{initials}</span>
        )}
      </div>
    </div>
  );
}
