Renders a Lucide icon — the icon set the Cortex frontend already uses (lucide-react). Use it anywhere an icon is needed; never hand-draw SVG.

```jsx
<Icon name="loader-circle" size={16} />
<Icon name="radio-tower" size={20} color="var(--text-muted)" />
```

Names are kebab-case lucide names. Default stroke weight 1.9 matches the app's line weight; bump to 2 for active/selected states.
