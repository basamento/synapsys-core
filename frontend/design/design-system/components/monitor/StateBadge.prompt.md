The single source of truth for process/execution state colour: running = teal, idle = violet, stopping = amber, failed = red. Labels stay lowercase, exactly as the API reports them.

```jsx
<StateBadge state="running" />
<StateBadge state="idle" desired />
```

Never hand-pick a tone for state elsewhere — use this so the four colours never drift.
