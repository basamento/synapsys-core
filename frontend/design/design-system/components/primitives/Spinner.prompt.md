Indeterminate activity, inside buttons and empty states. Prefer `Skeleton` for first loads and `Progress` for anything with a known duration.

```jsx
<Button disabled iconLeft={<Spinner size={14} color="currentColor" />}>Starting</Button>
```
