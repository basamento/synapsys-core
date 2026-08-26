Conic-gradient ring of the four states with the loaded count in the hole. Segment order is fixed (running, idle, stopping, failed) so the shape reads the same every poll.

```jsx
<StateDonut counts={{ running: 2, idle: 6, stopping: 1, failed: 1 }} total={10} />
```

Always beside a `MeterRow` legend — the ring alone doesn't carry numbers.
