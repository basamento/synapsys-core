export type LogLevel = "info" | "debug" | "warn" | "error" | "trace";

export interface LogRow {
  line: number;
  time: string;
  level: LogLevel;
  /** "trace" rows render indented with a tree glyph and no timestamp/level pill — for stack frames under an error row. */
  message: string;
}

export interface LogsModalProps {
  open?: boolean;
  title: string;
  meta?: string;
  logs: LogRow[];
  onClose?: () => void;
}

/** Always renders in the system's dark palette (base --ink-*/--teal/amber/red tokens), independent of the active app theme. */
export function LogsModal(props: LogsModalProps): JSX.Element | null;
