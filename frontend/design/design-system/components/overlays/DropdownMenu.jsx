import React from "react";

export function DropdownMenu({ open = false, trigger, items = [], align = "end", onSelect, width = 150 }) {
  const [isOpen, setOpen] = React.useState(open);
  React.useEffect(() => setOpen(open), [open]);
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {isOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", [align === "end" ? "right" : "left"]: 0,
          minWidth: width, background: "var(--surface-card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-overlay)", padding: 4, zIndex: 50,
        }}>
          {items.map((item) => (
            <div
              key={item.value}
              onClick={() => { setOpen(false); onSelect && onSelect(item.value); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                padding: "7px 10px", borderRadius: "var(--radius-xs)", cursor: "pointer",
                font: "var(--text-body-md)",
                background: item.active ? "var(--brand-soft)" : "transparent",
                color: item.active ? "var(--brand-soft-text)" : "var(--text-body)",
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
