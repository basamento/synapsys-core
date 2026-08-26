import { cn } from "@/lib/utils";

/**
 * The Nucleus mark: a soma with three axons, each ending in a terminal —
 * one core, three workers reaching out from it. Inline rather than an <img>
 * so the badge picks up the brand colour in whichever theme is active.
 */
export function NucleusMark({ size = 25, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Synapsys"
      className={cn("shrink-0", className)}
    >
      <circle cx="24" cy="24" r="22" fill="var(--brand)" />
      <path
        d="M24 24 24 9M24 24 36.99 31.5M24 24 11.01 31.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="6" fill="#FFFFFF" />
      <circle cx="24" cy="9" r="4" fill="var(--teal-500)" />
      <circle cx="36.99" cy="31.5" r="4" fill="var(--teal-500)" />
      <circle cx="11.01" cy="31.5" r="4" fill="var(--teal-500)" />
    </svg>
  );
}

/** Mark plus wordmark. The product is Synapsys; Cortex is this console. */
export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-center", compact ? "gap-2.5" : "gap-3")}>
      <NucleusMark size={compact ? 24 : 25} />
      <span className={cn("flex min-w-0 items-baseline", compact ? "gap-1.75" : "gap-2.25")}>
        <span
          className={cn(
            "font-display font-extrabold tracking-tight text-heading",
            compact ? "text-[16px]" : "text-[17px]",
          )}
        >
          Synapsys
        </span>
        <span className="type-eyebrow text-faint">Cortex</span>
      </span>
    </div>
  );
}
