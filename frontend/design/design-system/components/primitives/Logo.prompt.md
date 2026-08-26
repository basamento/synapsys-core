The Synapsys mark ("Nucleus") and its lockups. Never redraw it, never recolour the terminals, never set the wordmark in anything but Bricolage Grotesque 800 at −0.025em.

```jsx
<Logo wordmark product="Cortex" size={25} />   {/* app top bar */}
<Logo variant="favicon" size={16} />           {/* 16-20px only */}
<Logo variant="mono" size={32} style={{ color: "var(--text-heading)" }} />
```

Rules from the logo spec: clear space around the mark is 25% of its width; below 20px switch to `favicon` (the 2.6 axon stroke falls under one device pixel and greys out); on dark surfaces the mark is unchanged — only the wordmark colour flips, which `--text-heading` handles. Static files live in `assets/` for favicons, emails and anywhere React isn't available.
