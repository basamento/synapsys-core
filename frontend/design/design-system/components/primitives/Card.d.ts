import type { CSSProperties, ReactNode } from "react";

export interface CardProps {
  /** Applies the standard 18px/20px card padding. Turn off for tables and lists. */
  padded?: boolean;
  /** Heavier shadow — overlays and pulled-forward panels only. */
  raised?: boolean;
  /** Enables the subtle hover tint used on clickable entity cards. */
  interactive?: boolean;
  radius?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned slot — a badge, a count, a button. */
  aside?: ReactNode;
  style?: CSSProperties;
}

export function Card(props: CardProps): JSX.Element;
export function CardHeader(props: CardHeaderProps): JSX.Element;
