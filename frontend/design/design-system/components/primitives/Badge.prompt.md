Pill label for type, status and counts. Always lowercase for machine states (`idle`, `running`), Title Case for human labels (`Endless`, `Spring Boot`).

```jsx
<Badge tone="running">running</Badge>
<Badge variant="outline" tone="brand">Endless</Badge>
<Badge mono>#200</Badge>
```

For process/execution state prefer `StateBadge`, which picks the tone from the state string.
