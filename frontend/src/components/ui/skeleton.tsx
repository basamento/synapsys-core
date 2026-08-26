import { cn } from "@/lib/utils";

/**
 * Shown on first load only, one per element so the placeholder matches the
 * shape that replaces it. A refresh never shows skeletons — the countdown is
 * the signal that data is moving.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "animate-[cortex-shimmer_1.4s_linear_infinite] rounded-sm bg-[linear-gradient(90deg,var(--surface-sunken)_25%,var(--surface-subtle)_37%,var(--surface-sunken)_63%)] bg-[length:400%_100%]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
