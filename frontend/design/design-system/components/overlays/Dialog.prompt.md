Modal confirmation — used in Cortex for destructive commands (stopping a running process). Scrim is ink at 50% with a 3px blur; the panel takes the 16px radius and the overlay shadow.

```jsx
<Dialog title="Stop endless process 10?" description="The worker acknowledges within one heartbeat."
  footer={<><Button variant="outline">Cancel</Button><Button variant="destructive">Stop process</Button></>} />
```

It positions against the nearest positioned ancestor, so wrap screens in `position: relative`.
