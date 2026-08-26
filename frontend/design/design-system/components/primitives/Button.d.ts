import type { CSSProperties, ReactNode } from "react";

/**
 * @startingPoint section="Primitives" subtitle="Button, sizes and variants" viewport="700x180"
 */
export interface ButtonProps {
  /** default = violet brand fill. outline/secondary for row actions, destructive for Stop. */
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  /** sm (row actions, 30px) · default (38px) · lg (44px, mobile) · icon · icon-lg */
  size?: "sm" | "default" | "lg" | "icon" | "icon-lg";
  disabled?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  style?: CSSProperties;
  children?: ReactNode;
}

export function Button(props: ButtonProps): JSX.Element;
