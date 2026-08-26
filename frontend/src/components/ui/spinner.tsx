import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

/** One of only three loops in the console, and all three signal liveness. */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderCircle
      role="status"
      aria-label="Working"
      className={cn("size-3.5 animate-[cortex-spin_720ms_linear_infinite]", className)}
      {...props}
    />
  );
}

export { Spinner };
