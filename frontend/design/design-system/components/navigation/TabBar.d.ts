import type { CSSProperties } from "react";
import type { NavItem } from "./SideBar";

/**
 * @startingPoint section="Navigation" subtitle="Mobile bottom tab bar" viewport="390x80"
 */
export interface TabBarProps {
  items?: NavItem[];
  active?: string;
  onSelect?: (key: string) => void;
  style?: CSSProperties;
}

export function TabBar(props: TabBarProps): JSX.Element;
