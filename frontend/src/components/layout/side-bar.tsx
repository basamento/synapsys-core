import { NavLink } from "react-router-dom";
import { Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAppData } from "@/state/use-app-data";
import { CommandQueueCard } from "./command-queue-card";
import { LogoutButton } from "./logout-button";
import { NAV_ITEMS } from "./nav-items";

/**
 * A 210px column standing on the canvas, not floating in a card. The active
 * row is a brand fill with a violet glow under it — the one place the brand
 * colour is used as a surface rather than an accent.
 *
 * Between 700px and 1200px it collapses to icons, where the count chips would
 * not fit anyway.
 */
export function SideBar() {
  const { pagination } = useAppData();

  return (
    <nav
      aria-label="Views"
      className="flex h-full min-h-full w-14 shrink-0 flex-col gap-0.75 wide:w-(--sidebar-w)"
    >
      <span className="hidden px-3 pt-0.5 pb-2.5 type-eyebrow uppercase text-faint wide:block">Monitor</span>

      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === "/"}
          title={item.label}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.75 rounded-sm px-3 py-2.25 type-body-lg transition-colors",
              "justify-center wide:justify-start",
              isActive
                ? "bg-brand font-semibold text-on-brand shadow-brand"
                : "font-medium text-body hover:bg-sunken",
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon
                aria-hidden
                className={cn("size-4 shrink-0", isActive ? "text-on-brand" : "text-faint")}
                strokeWidth={isActive ? 2 : 1.9}
              />
              <span className="hidden wide:inline">{item.label}</span>
              {item.countOf && (
                <span
                  className={cn(
                    "ml-auto hidden rounded-xs px-1.75 py-0.25 type-mono-sm wide:inline",
                    isActive ? "bg-white/20 text-on-brand" : "bg-sunken text-muted-foreground",
                  )}
                >
                  {pagination[item.countOf].totalItems}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}

      <div className="mt-4 hidden wide:block">
        <CommandQueueCard />
      </div>

      <div className="mt-auto flex flex-col gap-0.75 pt-4">
        <NavLink
          to="/settings"
          title="Settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.75 rounded-sm px-3 py-2.25 type-body-lg transition-colors",
              "justify-center wide:justify-start",
              isActive
                ? "bg-brand font-semibold text-on-brand shadow-brand"
                : "font-medium text-body hover:bg-sunken",
            )
          }
        >
          {({ isActive }) => (
            <>
              <Settings
                aria-hidden
                className={cn("size-4 shrink-0", isActive ? "text-on-brand" : "text-faint")}
                strokeWidth={isActive ? 2 : 1.9}
              />
              <span className="hidden wide:inline">Settings</span>
            </>
          )}
        </NavLink>

        <LogoutButton />

        <p className="hidden px-3 pt-2 type-mono-sm leading-relaxed text-faint wide:block">
          © 2026 Julian Marzoli (Basamento)
          <br />
          Proprietary software
        </p>
      </div>
    </nav>
  );
}
