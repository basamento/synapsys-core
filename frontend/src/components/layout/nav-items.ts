import { BarChart3, History, LoaderCircle, PcCase, PlaySquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { AppDataCollection } from "@/api/app-data";

/**
 * The five views, in the order the operator reads them: what is happening,
 * who is connected, what they run, what ran, what was asked for.
 *
 * Both the sidebar and the mobile tab bar render this list, so a nav change
 * happens once. `countOf` names the collection whose total appears in the
 * row's chip; Summary counts nothing because it is not a listing.
 */
export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  countOf?: AppDataCollection;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Summary", href: "/", icon: BarChart3 },
  { label: "Workers", href: "/workers", icon: PcCase, countOf: "workers" },
  { label: "Processes", href: "/processes", icon: LoaderCircle, countOf: "processes" },
  { label: "Executions", href: "/executions", icon: PlaySquare, countOf: "executions" },
  { label: "Actions", href: "/actions", icon: History, countOf: "actions" },
];
