Loading placeholder for a known shape. Use one per real element (title line, badge, metric value) — never a single grey block standing in for a whole card.

```jsx
<Skeleton width={180} height={14} />
<Skeleton width={72} height={20} radius="var(--radius-pill)" />
```

Needs the `cortex-shimmer` keyframes from `tokens/base.css` consumers already load via `styles.css`.
