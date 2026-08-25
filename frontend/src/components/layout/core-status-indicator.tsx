import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAppData } from "@/state/use-app-data";

export function CoreStatusIndicator() {
  const { status, error, lastUpdatedAt } = useAppData();
  const state = getCoreStatus(status);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="h-8 gap-2 rounded-md px-3 font-medium text-muted-foreground"
          >
            <span className={cn("size-2.5 rounded-full", state.dotClass)} />
            <span>{state.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>
          {status === "error" && error
            ? error
            : lastUpdatedAt
              ? `Last sync: ${formatTime(lastUpdatedAt)}`
              : "Waiting for first sync"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function getCoreStatus(status: "idle" | "loading" | "ready" | "error") {
  if (status === "error") {
    return {
      label: "Core offline",
      dotClass: "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.16)]",
    };
  }

  if (status === "ready") {
    return {
      label: "Core online",
      dotClass: "bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.16)]",
    };
  }

  return {
    label: "Checking core",
    dotClass: "bg-muted-foreground/70 shadow-[0_0_0_3px_rgba(148,163,184,0.14)]",
  };
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
