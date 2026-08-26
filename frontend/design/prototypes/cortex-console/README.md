# Cortex Console — desktop UI kit

1440×900 click-through of the five operator views, in both themes (moon/sun button in the top bar).

- **Summary** — four count tiles, process-state donut with legend, framework meters, command queue, recent actions.
- **Workers** — table of connected workers plus a coverage panel.
- **Processes** — table with type, state, framework, last touch and per-row Start/Stop; buttons follow state.
- **Executions** — table pairing current state against desired state.
- **Actions** — table of command history, one lucide glyph per action type.

Interactions: nav switches view, theme toggle flips every token, page-size segmented control and pager are live.

Shape changes from the source app: listings are tables rather than stacked cards, the sidebar carries counts and a command-queue card, and each page header carries a search field, a filter chip and Refresh.

Screen source of truth: `frontend/src/pages/*`, `frontend/src/components/{layout,listing,process,worker,execution,action}`.
