import { PAGE_SIZE_OPTIONS } from "@/api/app-data";
import { cn } from "@/lib/utils";

/**
 * 10 / 25 / 50 as a segmented control rather than a dropdown: three options
 * are worth showing at once, and the current one is then readable at a glance.
 */
export function PageSizeControl({
  value,
  onChange,
  size = "sm",
}: {
  value: number;
  onChange: (pageSize: number) => void;
  size?: "sm" | "lg";
}) {
  return (
    <div
      role="group"
      aria-label="Rows per page"
      className={cn(
        "inline-flex w-fit gap-0.75 rounded-sm border border-edge p-0.75",
        size === "sm" ? "bg-surface" : "gap-0.75 rounded-md bg-subtle p-0.75",
      )}
    >
      {PAGE_SIZE_OPTIONS.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={cn(
              "rounded-xs transition-colors",
              size === "sm" ? "px-2.5 py-1 type-body-sm" : "rounded-sm px-4 py-2 type-body-md",
              active
                ? "bg-brand font-bold text-on-brand"
                : "font-medium text-muted-foreground hover:text-body",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
