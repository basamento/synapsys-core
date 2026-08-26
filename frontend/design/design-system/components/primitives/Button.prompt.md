The one button. Brand-filled `default` for the primary action per view (Refresh, Start), `outline` for its neighbour, `destructive` for Stop on a running process, `ghost` for icon-only chrome.

```jsx
<Button size="sm">Start</Button>
<Button size="sm" variant="outline">Stop</Button>
<Button variant="destructive" size="sm">Stop</Button>
<Button size="icon" variant="outline" iconLeft={<Icon name="moon" size={15} />} />
```

On mobile use `size="lg"` so the hit target clears 44px. Disabled renders at 45% opacity and keeps its footprint.
