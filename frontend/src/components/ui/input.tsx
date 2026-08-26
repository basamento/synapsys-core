import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9.5 w-full min-w-0 rounded-md border border-edge bg-surface px-3.25 type-body-md text-body outline-none transition-[border-color,box-shadow]",
        "placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
