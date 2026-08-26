import React from "react";

const CDN = "https://unpkg.com/lucide-static@0.544.0/icons/";
const cache = new Map();

/** Lucide icon, fetched as real lucide-static geometry (stroke: currentColor). */
export function Icon({ name, size = 16, strokeWidth = 1.9, color = "currentColor", style }) {
  const [svg, setSvg] = React.useState(() => cache.get(name) || null);

  React.useEffect(() => {
    if (cache.has(name)) { setSvg(cache.get(name)); return; }
    let alive = true;
    fetch(CDN + name + ".svg")
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((t) => { cache.set(name, t); if (alive) setSvg(t); })
      .catch(() => {});
    return () => { alive = false; };
  }, [name]);

  const box = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: size, height: size, color, flexShrink: 0, ...style,
  };
  if (!svg) return <span style={box} aria-hidden="true" />;
  const sized = svg
    .replace(/width="24"/, 'width="' + size + '"')
    .replace(/height="24"/, 'height="' + size + '"')
    .replace(/stroke-width="2"/, 'stroke-width="' + strokeWidth + '"');
  return <span style={box} aria-hidden="true" dangerouslySetInnerHTML={{ __html: sized }} />;
}
