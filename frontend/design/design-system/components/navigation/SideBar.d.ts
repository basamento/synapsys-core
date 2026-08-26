import type { CSSProperties, ReactNode } from "react";

export interface NavItem {
  key: string;
  label: string;
  /** Lucide name. The five Cortex views use the icons the app already imports. */
  icon: string;
}

/**
 * @startingPoint section="Navigation" subtitle="Cortex left nav with counts" viewport="700x330"
 */
export interface SideBarProps {
  items?: NavItem[];
  active?: string;
  /** Per-key trailing count, e.g. { processes: 200 }. Omit a key to hide its chip. */
  counts?: Record<string, number | string>;
  /** Mono eyebrow above the list. */
  label?: string;
  /** Slot under the nav — Cortex puts the command-queue card here. */
  footer?: ReactNode;
  onSelect?: (key: string) => void;
  style?: CSSProperties;
}

export const CORTEX_NAV: NavItem[];
export function SideBar(props: SideBarProps): JSX.Element;
