import type { ActionStatus, ExecutionState, ExecutionStatus } from "@/types/entities";
import type { BadgeTone } from "@/components/ui/badge";

/**
 * The single place a domain value becomes a colour.
 *
 * Nothing else in the app maps a state to a class. Adding a state means adding
 * one entry to each map here — never hunting for hard-coded colours.
 *
 * The four state colours are fixed by the design system: running teal, idle
 * violet, stopping amber, failed red. They are never reassigned, and an icon is
 * never coloured with one, because the badge is what carries the state.
 */

/**
 * The order states are drawn in wherever they are shown as a set: the donut's
 * segments and its legend. Fixed, so the ring's shape stays comparable across
 * polls even as the counts move. This is not the order the filter chips use —
 * those follow the lifecycle an operator thinks in.
 */
export const STATE_DISPLAY_ORDER: ExecutionState[] = ["running", "idle", "stopping", "failed"];

export const STATE_TONE: Record<ExecutionState, BadgeTone> = {
  idle: "idle",
  running: "running",
  stopping: "stopping",
  failed: "failed",
};

/** The swatch beside a state, used by the donut legend and the filter chips. */
export const STATE_DOT: Record<ExecutionState, string> = {
  idle: "bg-idle-dot",
  running: "bg-running-dot",
  stopping: "bg-stopping-dot",
  failed: "bg-failed-dot",
};

/** A done action reads like a healthy process; a waiting one like a stopping one. */
export const ACTION_STATUS_TONE: Record<ActionStatus, BadgeTone> = {
  done: "running",
  waiting: "stopping",
  failed: "failed",
};

/** An execution is either answering or it is not; only the former gets a tone. */
export const EXECUTION_STATUS_TONE: Record<ExecutionStatus, BadgeTone> = {
  active: "running",
  inactive: "neutral",
};
