import { cva } from "class-variance-authority";

/**
 * The console's four button roles and four sizes, straight from the design
 * system. Hover brightens a filled button rather than swapping its colour;
 * disabled keeps its footprint so a row's controls never shift as state
 * changes underneath them (that rule lives in the base layer).
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.75 whitespace-nowrap border border-transparent type-body-sm font-semibold transition-[filter,background-color,color,border-color] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-brand text-on-brand shadow-brand hover:brightness-106",
        outline: "bg-surface text-body hover:bg-subtle border-edge",
        destructive: "bg-failed-bg text-failed-fg hover:brightness-97",
        ghost: "text-body hover:bg-subtle",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-7.5 rounded-sm px-3.25",
        default: "h-9.5 rounded-md px-4.25",
        lg: "h-11 rounded-md px-4.5",
        icon: "size-8 rounded-sm p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
