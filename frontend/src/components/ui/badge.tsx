import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * The console's pill. `tone` carries meaning and is the only thing allowed to;
 * icons are never coloured with a state (the badge is what says the state).
 *
 * The four tones are fixed by the design system: running teal, idle violet,
 * stopping amber, failed red. `neutral` is for values that are not states —
 * a process type, an execution's inactive status.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-transparent type-caption font-semibold [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      tone: {
        neutral: "bg-sunken text-body",
        running: "bg-running-bg text-running-fg",
        idle: "bg-idle-bg text-idle-fg",
        stopping: "bg-stopping-bg text-stopping-fg",
        failed: "bg-failed-bg text-failed-fg",
      },
      /**
       * Outline swaps the tint for a hairline in the tone's own colour, which
       * is how a *desired* state is distinguished from an observed one.
       */
      variant: {
        soft: "px-2.5 py-0.75",
        outline: "bg-transparent px-2.5 py-0.5",
      },
      mono: {
        true: "type-mono-sm font-normal",
        false: "",
      },
    },
    compoundVariants: [
      { variant: "outline", tone: "neutral", class: "border-edge-brand text-brand-soft-text" },
      { variant: "outline", tone: "running", class: "border-current" },
      { variant: "outline", tone: "idle", class: "border-current" },
      { variant: "outline", tone: "stopping", class: "border-current" },
      { variant: "outline", tone: "failed", class: "border-current" },
    ],
    defaultVariants: {
      tone: "neutral",
      variant: "soft",
      mono: false,
    },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

function Badge({
  className,
  tone,
  variant,
  mono,
  dot = false,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean; dot?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ tone, variant, mono }), className)}
      {...props}
    >
      {dot && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </Comp>
  );
}

export { Badge };
