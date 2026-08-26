The surface everything sits on: white (light) / #0F1219 (dark), hairline border, 12px radius, one soft shadow.

```jsx
<Card>
  <CardHeader title="Process state" description="Current states from the loaded page." />
</Card>
<Card padded={false}>{/* table */}</Card>
```

Never nest a Card in a Card — use `surface-subtle` blocks (see MetricTile) inside.
