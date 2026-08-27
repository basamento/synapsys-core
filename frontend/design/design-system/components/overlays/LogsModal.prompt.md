Execution log viewer — opened by a "Logs" button on an Executions row. Always renders dark (a terminal pane, regardless of the active app theme), but built from the system's own base palette tokens (`--ink-*`, `--teal/amber/red-950/500`) so it still reads as this product, not a generic console.

Chrome mirrors `Table`'s header-strip/footer treatment (subtle background, hairline borders) and the 28px bordered icon square from Action rows. Level tags reuse the `Pill` look (tinted background, weight 600 caption) at the dark-mode tone values. Line numbers, a mono timestamp, a level pill, the message (wraps, does not truncate), and a per-row copy button that swaps to a checkmark for 1.2s. A "Copy all" button in the header copies every formatted line; a small teal dot with the `cortex-pulse` animation (the same one-loop liveness signal `CoreStatusIndicator` uses) marks it as a live stream. `trace` rows (stack frames under a failed execution) render indented, dimmer, without a timestamp or level pill.

```jsx
<LogsModal
  title="Execution #210 · logs"
  meta="process #5 · run 12"
  logs={[{ line: 1, time: "18:26:45", level: "info", message: "Opened log stream for run 12 on worker springboot-user-1" }]}
  onClose={() => setLogsExecution(null)}
/>
```

Not built from a source page — new for this brief, same category as `TabBar`. Positions against the nearest positioned ancestor, so wrap screens in `position: relative`. The consuming app owns fetching/streaming the real log lines; this component only renders and copies them.
