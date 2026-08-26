/**
 * @startingPoint section="Navigation" subtitle="Cortex top bar, desktop and compact" viewport="700x120"
 */
export interface TopBarProps {
  /** Second half of the lockup, set in mono caps: "Cortex". */
  product?: string;
  status?: "online" | "offline" | "checking";
  /** 0-100 fill of the poll countdown. */
  syncPercent?: number;
  syncSeconds?: number;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  initials?: string;
  /** Mobile layout: hamburger in, countdown and avatar out. */
  compact?: boolean;
  onMenu?: () => void;
}

export function TopBar(props: TopBarProps): JSX.Element;
