import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * The 4px meter used by the heartbeat countdown, the command queue and the
 * framework mix. Its tone matches whatever it measures — brand for the core's
 * own rhythm, a state colour when it measures processes in that state.
 */
const indicatorVariants = cva("h-full rounded-full transition-[width] duration-180", {
  variants: {
    tone: {
      brand: "bg-brand",
      running: "bg-running-dot",
      idle: "bg-idle-dot",
      stopping: "bg-stopping-dot",
      failed: "bg-failed-dot",
    },
  },
  defaultVariants: { tone: "brand" },
});

export type MeterTone = NonNullable<VariantProps<typeof indicatorVariants>["tone"]>;

function Progress({
  className,
  value,
  tone,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & VariantProps<typeof indicatorVariants>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn("relative h-1 w-full overflow-hidden rounded-full bg-meter-track", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(indicatorVariants({ tone }))}
        style={{ width: `${clamp(value)}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

function clamp(value: number | null | undefined) {
  if (!value || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export { Progress };
