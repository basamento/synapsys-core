import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A card is the second background plane: card surface, one hairline, one soft
 * shadow. Never a heavy drop, never a gradient.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col rounded-lg border border-edge bg-surface text-body shadow-card",
        className,
      )}
      {...props}
    />
  );
}

/** The standard interior: 18px vertical, 20px horizontal, 15px between blocks. */
function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-body"
      className={cn("flex flex-col gap-3.75 px-5 py-4.5", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex items-start justify-between gap-4", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("type-title text-heading", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("type-body-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Card, CardBody, CardHeader, CardTitle, CardDescription };
