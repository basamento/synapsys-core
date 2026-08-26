import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "./use-theme";

/** A 32px outline square that flips between the two themes. */
export function ModeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  const Icon = resolvedTheme === "dark" ? Sun : Moon;

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} aria-label={`Switch to ${next} theme`}>
      <Icon aria-hidden className="size-3.75 text-muted-foreground" />
    </Button>
  );
}
