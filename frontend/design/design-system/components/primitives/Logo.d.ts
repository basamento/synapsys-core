import type { CSSProperties } from "react";

/**
 * @startingPoint section="Brand" subtitle="Nucleus mark and lockups" viewport="700x150"
 */
export interface LogoProps {
  /**
   * primary — violet disc, the default everywhere.
   * plain — no ground disc, for tight or already-violet surfaces.
   * mono — single-colour knockout in currentColor, for one-ink contexts.
   * favicon — thicker axons and larger terminals; use at 16-20px only.
   */
  variant?: "primary" | "plain" | "mono" | "favicon";
  /** Rendered box in px. 25-26 in a top bar, 34+ for marketing lockups. */
  size?: number;
  /** Adds the "Synapsys" wordmark (Bricolage Grotesque 800, −0.025em). */
  wordmark?: boolean;
  /** Product suffix in mono caps beside the wordmark, e.g. "Cortex". */
  product?: string;
  style?: CSSProperties;
}

export function Logo(props: LogoProps): JSX.Element;
