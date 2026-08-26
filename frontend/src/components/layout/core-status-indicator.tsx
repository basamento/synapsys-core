import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { useAppData } from "@/state/use-app-data";

/**
 * Whether the core is still answering — the one question the whole console
 * exists to keep visible. When it is not, the pill turns red and carries the
 * reason in its tooltip; there is no toast.
 */
export function CoreStatusIndicator({ compact = false }: { compact?: boolean }) {
  const { status, error, lastUpdatedAt } = useAppData();

  const tone = status === "error" ? "failed" : status === "ready" ? "running" : "neutral";
  const label =
    status === "error"
      ? compact
        ? "Offline"
        : "Core offline"
      : status === "ready"
        ? compact
          ? "Online"
          : "Core online"
        : "Checking core";

  const detail =
    status === "error" && error
      ? error
      : lastUpdatedAt
        ? `Last sync: ${formatDateTime(lastUpdatedAt)}`
        : "Waiting for first sync";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            tone={tone}
            // The dot pulses only while checking: a loop in this console always
            // means "still alive", never decoration.
            className={cn(compact && "px-2.25 py-1", status === "idle" && "animate-[cortex-pulse_1.4s_ease-in-out_infinite]")}
            dot
          >
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{detail}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
