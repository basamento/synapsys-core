A process with its command buttons. The buttons follow state: idle → Start primary, running → Stop destructive, failed → Retry, stopping → both disabled.

```jsx
<ProcessCard process={p} onStart={start} onStop={stop} />
<ProcessCard process={p} compact />
```

Desktop listings use `DataTable` rows instead; this card is the mobile and detail-page shape.
