import React from "react";

export function DataTable({ columns = [], rows = [], footer, sortKey, sortDir = "asc", onSort, style }) {
  const template = columns.map((c) => c.width || "1fr").join(" ");

  return (
    <div style={{
      background: "var(--surface-card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-card)", ...style,
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: template, alignItems: "center", height: 38, padding: "0 20px",
        background: "var(--surface-subtle)", borderBottom: "1px solid var(--border)",
        font: "var(--text-eyebrow)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-faint)",
      }}>
        {columns.map((c) => (
          <div
            key={c.key}
            onClick={() => c.sortable && onSort && onSort(c.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6, cursor: c.sortable ? "pointer" : "default",
              justifyContent: c.align === "right" ? "flex-end" : "flex-start",
              color: c.key === sortKey ? "var(--text-body)" : "inherit",
            }}
          >
            {c.header}
            {c.key === sortKey && (
              <span style={{ color: "var(--brand)", fontSize: 9 }}>{sortDir === "asc" ? "▲" : "▼"}</span>
            )}
          </div>
        ))}
      </div>

      {rows.map((row, i) => (
        <div
          key={row.id ?? i}
          style={{
            display: "grid", gridTemplateColumns: template, alignItems: "center",
            minHeight: "var(--row-h)", padding: "0 20px",
            borderBottom: i === rows.length - 1 ? "none" : "1px solid var(--border)",
            background: row.highlight ? "var(--surface-subtle)" : "transparent",
          }}
        >
          {columns.map((c) => (
            <div key={c.key} style={{ display: "flex", justifyContent: c.align === "right" ? "flex-end" : "flex-start", minWidth: 0 }}>
              {row.cells[c.key]}
            </div>
          ))}
        </div>
      ))}

      {footer}
    </div>
  );
}
