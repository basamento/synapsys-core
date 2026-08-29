import type {
  ActionType,
  ExecutionState,
  ProcessType,
  WorkerFramework,
} from "@/types/entities";

/**
 * Every label the console shows for a machine-reported value lives here.
 *
 * Two rules from the design system decide the casing:
 * machine states stay lowercase exactly as the API spells them, and
 * human-facing labels are Title Case.
 */

const FRAMEWORK_LABELS: Record<WorkerFramework, string> = {
  springboot: "Spring Boot",
  nodejs: "Node.js",
  python: "Python",
  go: "Go",
  unknown: "Unknown",
};

const PROCESS_TYPE_LABELS: Record<ProcessType, string> = {
  endless: "Endless",
  progressive: "Progressive",
};

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  create: "Create",
  start: "Start",
  stop: "Stop",
  heartbeat: "Heartbeat",
  ack: "Ack",
};

export const FRAMEWORKS = Object.keys(FRAMEWORK_LABELS) as WorkerFramework[];
export const EXECUTION_STATES: ExecutionState[] = ["idle", "running", "stopping", "failed"];
export const ACTION_TYPES = Object.keys(ACTION_TYPE_LABELS) as ActionType[];

export function formatFramework(framework: WorkerFramework) {
  return FRAMEWORK_LABELS[framework] ?? FRAMEWORK_LABELS.unknown;
}

export function formatProcessType(type: ProcessType) {
  return PROCESS_TYPE_LABELS[type] ?? type;
}

export function formatActionType(type: ActionType) {
  return ACTION_TYPE_LABELS[type] ?? type;
}

/** A wall clock, for the mono columns: "18:10:40". */
export function formatClock(value: string | null | undefined) {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

/** A full timestamp, for tooltips where the bare clock would be ambiguous. */
export function formatDateTime(value: string | null | undefined) {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

/**
 * Freshness for the meta line: "polled 4 seconds ago".
 * Reported in whole seconds up to a minute, because the poll runs every five.
 */
export function formatRelative(value: string | null | undefined, now = Date.now()) {
  const date = toDate(value);
  if (!date) return "never polled";

  const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (seconds < 60) return `polled ${seconds} ${plural(seconds, "second")} ago`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `polled ${minutes} ${plural(minutes, "minute")} ago`;

  const hours = Math.round(minutes / 60);
  return `polled ${hours} ${plural(hours, "hour")} ago`;
}

/** The gap between a worker's last touch and now, as the Coverage tile shows it. */
export function formatGap(value: string | null | undefined, now = Date.now()) {
  const date = toDate(value);
  if (!date) return "—";

  const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

/**
 * Joins the facts of a meta line with the separator the design system uses.
 * Falsy parts drop out, so a caller can pass a conditional fact directly.
 */
export function metaLine(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" · ");
}

/**
 * A count the core may not have reported. An em dash says "not reported",
 * which a bare 0 would misrepresent as "none".
 */
export function formatCount(value: number | undefined | null) {
  return value ?? "—";
}

export function plural(count: number, noun: string) {
  return count === 1 ? noun : `${noun}s`;
}

function toDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
