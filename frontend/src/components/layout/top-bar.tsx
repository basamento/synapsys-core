import { BrandLockup } from "@/components/cortex/brand-lockup";
import { useIsMobile } from "@/hooks/use-layout";
import { NavLink } from "react-router-dom";
import { Settings } from "lucide-react";
import { CoreStatusIndicator } from "./core-status-indicator";
import { ModeToggle } from "./mode-toggle";
import { SyncCountdown } from "./sync-countdown";

/**
 * Full-bleed, one hairline at the bottom, no card. Desktop carries the
 * heartbeat meter; mobile drops the meter — at 390px the status pill alone
 * answers "is the core up".
 */
export function TopBar() {
  const isMobile = useIsMobile();

  return (
    <header className="flex h-(--mobile-topbar-h) shrink-0 items-center justify-between border-b border-edge bg-surface px-3.5 sm:h-(--topbar-h) sm:px-(--shell-pad-x)">
      <BrandLockup compact={isMobile} />

      <div className="flex items-center gap-2 sm:gap-3.5">
        <CoreStatusIndicator compact={isMobile} />
        {!isMobile && (
          <>
            <SyncCountdown />
            <ModeToggle />
          </>
        )}
        {isMobile && (
          <>
            <NavLink
              to="/settings"
              aria-label="Settings"
              title="Settings"
              className={({ isActive }) =>
                `grid size-8 place-items-center rounded-sm transition-colors ${isActive ? "bg-brand-soft text-brand" : "text-muted-foreground hover:bg-subtle"}`
              }
            >
              <Settings aria-hidden className="size-4" strokeWidth={1.9} />
            </NavLink>
            <ModeToggle />
          </>
        )}
      </div>
    </header>
  );
}
