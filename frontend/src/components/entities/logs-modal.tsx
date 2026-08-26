import { Check, Copy, Terminal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchExecutionLogs, type ExecutionLog } from "@/api/logs";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatClock } from "@/lib/format";
import type { Execution } from "@/types/entities";

const POLL_INTERVAL_MS = 2000;

export function LogsModal({ execution, onClose }: { execution: Execution; onClose: () => void }) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLine, setCopiedLine] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const lastSequenceRef = useRef(0);

  const active = execution.status === "active";

  const load = useCallback(
    async (initial = false) => {
      try {
        const next = await fetchExecutionLogs(execution.id, initial ? 0 : lastSequenceRef.current);
        setLogs((current) => {
          const merged = initial ? next : mergeLogs(current, next);
          lastSequenceRef.current = merged.at(-1)?.sequence ?? 0;
          return merged;
        });
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load logs.");
      } finally {
        setLoading(false);
      }
    },
    [execution.id],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => void load(false), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [active, load]);

  const formattedLines = useMemo(() => logs.map(formatLog), [logs]);

  async function copyAll() {
    await navigator.clipboard?.writeText(formattedLines.join("\n"));
    setCopiedAll(true);
    window.setTimeout(() => setCopiedAll(false), 1500);
  }

  async function copyLine(log: ExecutionLog) {
    await navigator.clipboard?.writeText(formatLog(log));
    setCopiedLine(log.sequence);
    window.setTimeout(() => setCopiedLine((current) => (current === log.sequence ? null : current)), 1200);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[84vh] max-w-3xl gap-0 overflow-hidden border-[var(--ink-700)] bg-[var(--ink-850)] p-0 text-[var(--ink-100)] shadow-[0_24px_56px_rgba(0,0,0,.55)]">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--ink-700)] bg-[var(--ink-750)] px-4.5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm border border-[var(--ink-700)] bg-[var(--ink-800)]">
              <Terminal className="size-3.5 text-[var(--ink-300)]" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-baseline gap-2.5">
                <DialogTitle className="truncate text-white">Execution #{execution.id} · logs</DialogTitle>
                {active && (
                  <span className="inline-flex shrink-0 items-center gap-1.25 rounded-full bg-[var(--teal-950)] px-2.25 py-0.5 type-caption font-semibold text-[var(--teal-500)]">
                    <span className="size-1.5 animate-[cortex-pulse_1.4s_ease-in-out_infinite] rounded-full bg-current" />
                    live
                  </span>
                )}
              </div>
              <DialogDescription className="type-mono-sm text-[var(--ink-300)]">
                process #{execution.processId}{execution.runId ? ` · run ${execution.runId}` : ""}
              </DialogDescription>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => void copyAll()} className="inline-flex h-7.5 items-center gap-1.75 rounded-sm border border-[var(--ink-700)] bg-[var(--ink-850)] px-3 type-body-sm font-semibold text-[var(--ink-100)] hover:bg-[var(--ink-800)]">
              {copiedAll ? <Check className="size-3.25 text-[var(--teal-500)]" /> : <Copy className="size-3.25 text-[var(--ink-300)]" />}
              {copiedAll ? "Copied" : "Copy all"}
            </button>
            <DialogClose asChild>
              <button type="button" aria-label="Close logs" className="inline-flex size-7.5 items-center justify-center rounded-sm border border-[var(--ink-700)] bg-[var(--ink-850)] text-[var(--ink-300)] hover:bg-[var(--ink-800)]">
                <X className="size-3.5" />
              </button>
            </DialogClose>
          </div>
        </div>

        <div className="min-h-48 overflow-y-auto py-1.5">
          {loading && logs.length === 0 ? (
            <p className="px-4.5 py-12 text-center type-mono-sm text-[var(--ink-400)]">Loading logs…</p>
          ) : error && logs.length === 0 ? (
            <p className="px-4.5 py-12 text-center type-mono-sm text-[var(--red-500)]">{error}</p>
          ) : logs.length === 0 ? (
            <p className="px-4.5 py-12 text-center type-mono-sm text-[var(--ink-400)]">No logs captured.</p>
          ) : (
            logs.map((log) => (
              <div key={`${log.executionId}-${log.sequence}`} className="group grid grid-cols-[30px_68px_58px_minmax(0,1fr)_28px] gap-3 px-4.5 py-1.25 font-mono text-xs leading-5 hover:bg-[var(--ink-800)]">
                <span className="pt-0.5 text-right text-[var(--ink-500)]">{log.sequence}</span>
                <span className="pt-0.5 text-[var(--ink-300)]">{formatClock(log.timestamp)}</span>
                <span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 type-caption font-semibold ${log.level === "error" ? "bg-[var(--red-950)] text-[var(--red-500)]" : "bg-[var(--teal-950)] text-[var(--teal-500)]"}`}>
                    {log.level}
                  </span>
                </span>
                <span className="min-w-0 break-words text-[var(--ink-100)]">{log.message}</span>
                <button type="button" aria-label={`Copy log line ${log.sequence}`} onClick={() => void copyLine(log)} className="inline-flex size-5.5 items-center justify-center rounded-xs text-[var(--ink-300)] opacity-50 hover:bg-[var(--ink-700)] hover:opacity-100">
                  {copiedLine === log.sequence ? <Check className="size-3 text-[var(--teal-500)]" /> : <Copy className="size-3" />}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--ink-700)] bg-[var(--ink-750)] px-4.5 py-2.5 type-mono-sm text-[var(--ink-300)]">
          <span>{logs.length} {logs.length === 1 ? "line" : "lines"}</span>
          <span className="text-[var(--ink-500)]">esc to close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function mergeLogs(current: ExecutionLog[], next: ExecutionLog[]) {
  const bySequence = new Map(current.map((log) => [log.sequence, log]));
  next.forEach((log) => bySequence.set(log.sequence, log));
  return [...bySequence.values()].sort((a, b) => a.sequence - b.sequence);
}

function formatLog(log: ExecutionLog) {
  return `[${formatClock(log.timestamp)}] ${log.level.toUpperCase().padEnd(5, " ")} ${log.message}`;
}
