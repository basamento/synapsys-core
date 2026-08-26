import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

/**
 * Mobile navigation: five equal columns, each at least the 44px tap minimum.
 * The source app had no mobile navigation at all, so this is the one nav
 * component with no desktop counterpart.
 *
 * The labels drop the eyebrow's 0.12em tracking. At the design's 390px width
 * either spelling fits, but "Executions" with tracking is 76px in a 78px
 * column, so on a 320px phone the five labels collide. Tracking is the part
 * that can go without changing how the bar reads.
 */
export function TabBar() {
  return (
    <nav
      aria-label="Views"
      className="grid h-(--mobile-tabbar-h) shrink-0 grid-cols-5 border-t border-edge bg-surface"
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === "/"}
          className={({ isActive }) =>
            cn(
              "flex min-h-(--tap-min) min-w-0 flex-col items-center justify-center gap-1 px-0.5 type-eyebrow tracking-normal transition-colors",
              isActive ? "font-semibold text-brand" : "font-medium text-faint",
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon aria-hidden className="size-4.75 shrink-0" strokeWidth={isActive ? 2.1 : 1.8} />
              <span className="max-w-full truncate">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
