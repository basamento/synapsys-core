import React from "react";
import { Icon } from "../primitives/Icon.jsx";

function visiblePages(page, totalPages) {
  const out = new Set([1, page - 1, page, page + 1, totalPages].filter((p) => p >= 1 && p <= totalPages));
  return [...out].sort((a, b) => a - b);
}

export function Pagination({ page = 1, totalPages = 1, onChange, style }) {
  const pages = visiblePages(page, totalPages);
  const arrow = (dir, disabled) => (
    <span
      onClick={() => !disabled && onChange && onChange(page + (dir === "next" ? 1 : -1))}
      style={{
        width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "var(--surface-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
        opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <Icon name={dir === "next" ? "chevron-right" : "chevron-left"} size={13} color="var(--text-body)" strokeWidth={2.3} />
    </span>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, ...style }}>
      {arrow("prev", page <= 1)}
      {pages.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && p - pages[i - 1] > 1 && <span style={{ color: "var(--text-faint)", font: "var(--text-body-sm)", padding: "0 4px" }}>…</span>}
          <span
            onClick={() => onChange && onChange(p)}
            style={{
              minWidth: 28, height: 28, padding: "0 6px", display: "inline-flex", alignItems: "center", justifyContent: "center",
              borderRadius: "var(--radius-sm)", cursor: "pointer", font: "var(--text-body-sm)",
              fontWeight: p === page ? 700 : 500,
              background: p === page ? "var(--brand-soft)" : "transparent",
              color: p === page ? "var(--brand-soft-text)" : "var(--text-body)",
            }}
          >{p}</span>
        </React.Fragment>
      ))}
      {arrow("next", page >= totalPages)}
    </div>
  );
}
