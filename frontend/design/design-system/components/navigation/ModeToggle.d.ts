import type { CSSProperties } from "react";

export interface ModeToggleProps {
  /** Current theme — the icon shows the mode you'd switch TO. */
  theme?: "light" | "dark";
  onToggle?: () => void;
  style?: CSSProperties;
}

export function ModeToggle(props: ModeToggleProps): JSX.Element;
