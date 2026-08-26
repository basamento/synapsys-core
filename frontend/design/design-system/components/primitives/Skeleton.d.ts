import type { CSSProperties } from "react";

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: string;
  style?: CSSProperties;
}

export function Skeleton(props: SkeletonProps): JSX.Element;
