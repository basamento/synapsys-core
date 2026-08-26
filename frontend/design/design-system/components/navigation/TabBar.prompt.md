Mobile counterpart to SideBar — the same five views, pinned to the bottom, icon over label, brand colour for the active tab. Intentional addition: the source app has no mobile navigation.

```jsx
<TabBar active="summary" onSelect={go} />
```

Each tab is at least 44px tall. Never show counts here; they live in the page header.
