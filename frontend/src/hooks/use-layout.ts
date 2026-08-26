import { useSyncExternalStore } from "react";

/**
 * The console has three layouts, and these are the two widths between them:
 *
 *   full     ≥ 1200  sidebar with labels, every column
 *   compact  700–1199 sidebar collapsed to icons, secondary columns dropped
 *   mobile   < 700   bottom tab bar, card listings, filter sheet
 *
 * These are the design system's breakpoints, not Tailwind's. The CSS side reads
 * the same numbers through the `wide` variant and the `sm` default.
 */
export const MOBILE_BREAKPOINT = 700;
export const FULL_BREAKPOINT = 1200;

export type Layout = "mobile" | "compact" | "full";

const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
const FULL_QUERY = `(min-width: ${FULL_BREAKPOINT}px)`;

/**
 * Reads the layout as an external store rather than mirroring it into state,
 * so the first render already has the right answer and a resize cannot leave
 * the tree briefly showing the wrong one.
 */
export function useLayout(): Layout {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsMobile() {
  return useLayout() === "mobile";
}

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(MOBILE_QUERY), window.matchMedia(FULL_QUERY)];
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () => queries.forEach((query) => query.removeEventListener("change", onChange));
}

function getSnapshot(): Layout {
  if (window.matchMedia(MOBILE_QUERY).matches) return "mobile";
  return window.matchMedia(FULL_QUERY).matches ? "full" : "compact";
}

/** Without a window there is no viewport to measure, so assume the desk view. */
function getServerSnapshot(): Layout {
  return "full";
}
