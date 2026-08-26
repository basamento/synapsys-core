import type { ReactNode } from "react";

export interface TooltipProps {
  /** One short line, no period. Truth the UI can't show inline: "Last sync: 18:11:10". */
  label: ReactNode;
  side?: "top" | "bottom";
  children: ReactNode;
}

export function Tooltip(props: TooltipProps): JSX.Element;
