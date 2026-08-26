// Resolves the generated design-system bundle namespace without hard-coding it.
// Before the compiler has produced _ds_bundle.js (e.g. a raw file preview), it
// returns placeholder components so a card degrades to a readable note.
window.dsResolve = function (names) {
  const direct = window.Cortex || window.SynapsysCortex || window.DS;
  if (direct && names.every((n) => direct[n])) return direct;
  for (const k of Object.keys(window)) {
    const v = window[k];
    if (v && typeof v === "object" && names.every((n) => typeof v[n] === "function")) return v;
  }
  const out = {};
  for (const n of names) {
    out[n] = function Placeholder() {
      return window.React.createElement(
        "span",
        {
          style: {
            font: "var(--text-mono-sm)",
            color: "var(--text-faint)",
            border: "1px dashed var(--border-strong)",
            borderRadius: "var(--radius-xs)",
            padding: "3px 8px",
          },
        },
        n + " — bundle not built yet"
      );
    };
  }
  return out;
};
