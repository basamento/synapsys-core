import React from "react";
import { Pagination } from "./Pagination.jsx";

export function ListingPagination({
  page = 1, pageSize = 10, totalItems = 0, pageSizeOptions = [10, 25, 50],
  onPageChange, onPageSizeChange, style,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const first = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
      padding: "12px 20px", background: "var(--surface-subtle)", borderTop: "1px solid var(--border)", ...style,
    }}>
      <span style={{ font: "var(--text-body-sm)", color: "var(--text-muted)" }}>
        Showing <span style={{ font: "var(--text-mono-md)", color: "var(--text-heading)" }}>{first}–{last}</span>
        {" of "}<span style={{ font: "var(--text-mono-md)", color: "var(--text-heading)" }}>{totalItems}</span>
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          display: "inline-flex", gap: 2, padding: 3, background: "var(--surface-card)",
          border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
        }}>
          {pageSizeOptions.map((n) => (
            <span
              key={n}
              onClick={() => onPageSizeChange && onPageSizeChange(n)}
              style={{
                padding: "4px 10px", borderRadius: "var(--radius-xs)", cursor: "pointer",
                font: "var(--text-body-sm)", fontWeight: n === pageSize ? 700 : 500,
                background: n === pageSize ? "var(--brand)" : "transparent",
                color: n === pageSize ? "var(--text-on-brand)" : "var(--text-muted)",
              }}
            >{n}</span>
          ))}
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
      </div>
    </div>
  );
}
