import React from "react";
import { Icon } from "../primitives/Icon.jsx";

/** Forced-dark regardless of app theme (a terminal pane reads as terminal in both themes).
 *  Built from the same palette as the rest of the system: the theme-invariant base tokens
 *  (--ink-*, --teal/amber/red-950/500) rather than the light/dark-flipped semantic ones. */
const LEVEL = {
  info: { bg: "var(--teal-950)", fg: "var(--teal-500)", label: "info" },
  warn: { bg: "var(--amber-950)", fg: "var(--amber-500)", label: "warn" },
  error: { bg: "var(--red-950)", fg: "var(--red-500)", label: "error" },
  debug: { bg: "var(--ink-800)", fg: "var(--ink-400)", label: "debug" },
  trace: { bg: null, fg: "var(--ink-500)", label: "" },
};

export function LogsModal({ open = true, title, meta, logs = [], onClose }) {
  const [copiedLine, setCopiedLine] = React.useState(null);
  const [copiedAll, setCopiedAll] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const fmt = (row) => (row.level === "trace" ? "    " + row.message
    : "[" + row.time + "] " + (LEVEL[row.level]?.label || "").toUpperCase().padEnd(5, " ") + " " + row.message);
  const copyLine = (row) => {
    navigator.clipboard?.writeText(fmt(row)).catch(() => {});
    setCopiedLine(row.line);
    setTimeout(() => setCopiedLine((c) => (c === row.line ? null : c)), 1200);
  };
  const copyAll = () => {
    navigator.clipboard?.writeText(logs.map(fmt).join("\n")).catch(() => {});
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, display: "grid", placeItems: "center",
      background: "rgba(10, 12, 17, 0.5)", backdropFilter: "blur(3px)", padding: 20, zIndex: 60,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 720, maxWidth: "100%", maxHeight: "84vh", background: "var(--ink-850)",
        border: "1px solid var(--ink-700)", borderRadius: "var(--radius-xl)", boxShadow: "0 24px 56px rgba(0,0,0,.55)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 18px",
          background: "var(--ink-750)", borderBottom: "1px solid var(--ink-700)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span style={{ width: 28, height: 28, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "var(--ink-800)", border: "1px solid var(--ink-700)", borderRadius: "var(--radius-sm)" }}>
              <Icon name="terminal" size={14} color="var(--ink-300)" strokeWidth={2} />
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, whiteSpace: "nowrap" }}>
                <span style={{ font: "var(--text-title)", color: "#FFFFFF" }}>{title}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--teal-950)", color: "var(--teal-500)",
                  font: "var(--text-caption)", fontWeight: 600, padding: "2px 9px", borderRadius: "var(--radius-pill)", flexShrink: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor", animation: "cortex-pulse 1.4s var(--ease-out) infinite" }} />
                  live
                </span>
              </div>
              {meta && <span style={{ font: "var(--text-mono-sm)", color: "var(--ink-300)" }}>{meta}</span>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button onClick={copyAll} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 30, padding: "0 12px",
              borderRadius: "var(--radius-sm)", background: "var(--ink-850)", border: "1px solid var(--ink-700)", color: "var(--ink-100)",
              font: "var(--text-body-sm)", fontWeight: 600, cursor: "pointer" }}>
              <Icon name={copiedAll ? "check" : "copy"} size={13} color={copiedAll ? "var(--teal-500)" : "var(--ink-300)"} strokeWidth={2.2} />
              {copiedAll ? "Copied" : "Copy all"}
            </button>
            <button onClick={onClose} style={{ width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center",
              borderRadius: "var(--radius-sm)", background: "var(--ink-850)", border: "1px solid var(--ink-700)", cursor: "pointer" }}>
              <Icon name="x" size={14} color="var(--ink-300)" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div style={{ overflowY: "auto", padding: "6px 0" }}>
          {logs.map((row) => {
            const lvl = LEVEL[row.level] || LEVEL.debug;
            const trace = row.level === "trace";
            return (
              <div key={row.line} className="cortex-log-row" style={{ display: "grid",
                gridTemplateColumns: "30px 68px 58px minmax(0, 1fr) 28px", gap: 12, padding: "5px 18px", font: "var(--text-mono-sm)" }}>
                <span style={{ color: "var(--ink-500)", textAlign: "right", paddingTop: 2 }}>{row.line}</span>
                <span style={{ color: "var(--ink-300)", paddingTop: 2 }}>{trace ? "" : row.time}</span>
                <span style={{ paddingTop: 1 }}>
                  {lvl.label && (
                    <span style={{ display: "inline-flex", background: lvl.bg, color: lvl.fg, font: "var(--text-caption)", fontWeight: 600,
                      padding: "2px 8px", borderRadius: "var(--radius-pill)" }}>{lvl.label}</span>
                  )}
                </span>
                <span style={{ color: trace ? "var(--ink-500)" : "var(--ink-100)", wordBreak: "break-word", minWidth: 0, paddingLeft: trace ? 14 : 0 }}>
                  {trace ? "\u21B3 " : ""}{row.message}
                </span>
                <span className="cortex-log-copy" onClick={() => copyLine(row)} style={{ width: 22, height: 22, display: "inline-flex",
                  alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-xs)", cursor: "pointer",
                  opacity: copiedLine === row.line ? 1 : 0.5 }}>
                  <Icon name={copiedLine === row.line ? "check" : "copy"} size={12} color={copiedLine === row.line ? "var(--teal-500)" : "var(--ink-300)"} strokeWidth={2.2} />
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px",
          background: "var(--ink-750)", borderTop: "1px solid var(--ink-700)" }}>
          <span style={{ font: "var(--text-mono-sm)", color: "var(--ink-300)" }}>{logs.length} lines</span>
          <span style={{ font: "var(--text-mono-sm)", color: "var(--ink-500)" }}>esc to close</span>
        </div>
      </div>
    </div>
  );
}
