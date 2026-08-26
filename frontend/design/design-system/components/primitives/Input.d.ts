import type { CSSProperties, ReactNode } from "react";

export interface InputProps {
  value?: string;
  placeholder?: string;
  /** Icon inside the field, before the text — usually <Icon name="search" size={14} />. */
  iconLeft?: ReactNode;
  /** Trailing slot: a clear button, a keyboard hint, a unit. */
  trailing?: ReactNode;
  size?: "sm" | "default" | "lg";
  readOnly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  style?: CSSProperties;
}

export function Input(props: InputProps): JSX.Element;
