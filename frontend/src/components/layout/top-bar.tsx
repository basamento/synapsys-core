import { BrandLockup } from "@/components/cortex/brand-lockup";
import { useIsMobile } from "@/hooks/use-layout";
import { CoreStatusIndicator } from "./core-status-indicator";
import { ModeToggle } from "./mode-toggle";
import { SyncCountdown } from "./sync-countdown";

/**
 * Full-bleed, one hairline at the bottom, no card. Desktop carries the
 * heartbeat meter and an operator avatar; mobile drops both — at 390px the
 * status pill alone answers "is the core up".
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
            <OperatorAvatar />
          </>
        )}
        {isMobile && <ModeToggle />}
      </div>
    </header>
  );
}

/**
 * The console has no accounts yet, so this is the operator's initials and
 * nothing more — no menu behind it, because there is nothing to put in one.
 */
function OperatorAvatar() {
  return (
    <span
      aria-hidden
      className="flex size-8 items-center justify-center rounded-full bg-brand-soft type-caption font-bold text-brand-soft-text"
    >
      SU
    </span>
  );
}
