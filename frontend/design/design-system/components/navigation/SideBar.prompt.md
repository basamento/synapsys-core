Desktop left nav: five views, brand-filled active row, mono count chips. Sits on the canvas, not in a card.

```jsx
<SideBar active="processes" counts={{ workers: 1, processes: 200, executions: 200, actions: 200 }} onSelect={go} />
```

Import `CORTEX_NAV` when you need the same five entries elsewhere (mobile TabBar, breadcrumbs).
