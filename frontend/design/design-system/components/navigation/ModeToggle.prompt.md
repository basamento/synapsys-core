Light/dark switch in the top bar. Cortex ships both themes as equals — Direction C light is the default, Direction B dark is the operator's night view.

```jsx
<ModeToggle theme={theme} onToggle={() => setTheme(t => t === "dark" ? "light" : "dark")} />
```

Toggle by adding/removing `class="dark"` on `<html>`; every token flips.
