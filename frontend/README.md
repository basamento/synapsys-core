# Synapsys Cortex — console

The operator console for the Synapsys control plane. Workers connect, register
long-running processes, and receive start/stop commands; this shows what the
core knows and lets an operator issue those two commands.

React 19 · Vite · TypeScript · Tailwind CSS v4 · shadcn/ui · lucide-react ·
react-router-dom.

## Running it

```bash
npm run dev
```

The console polls `GET /api/state` every five seconds. In development it talks
to `http://localhost:8080`; point it elsewhere with `VITE_API_BASE` in a
`.env.local`. In production the core serves the built bundle itself, so requests
are same-origin.

```bash
npm run build   # tsc -b && vite build → dist/
npm run lint
```

`dist/` is what `backend/web` embeds into the core binary, so the build has no
external runtime dependencies — fonts included.

## Where things live

```
src/
  index.css              every colour, font, radius, shadow and motion value
  fonts.css              the three self-hosted faces, latin subsets only
  api/                   the HTTP contract: one query type per listing
  state/                 the polled snapshot, and the query that produced it
  hooks/use-layout.ts    the two breakpoints, in one place
  lib/format.ts          every label shown for a machine-reported value
  components/
    ui/                  shadcn primitives, restyled through the tokens
    cortex/              domain pieces: badges, tiles, meters, the donut
    listing/             the shared listing machinery
    entities/            one ListingDefinition per entity
    layout/              the shell: top bar, sidebar, tab bar, theme
  pages/                 five views, each a few lines over the above
```

### Styling

`src/index.css` is the only file in the app that writes down a design value.
Everything else reaches those values through Tailwind utilities. Its own layers
run palette → semantics → shadcn slots → `@theme`, so a colour is defined once
and every consumer — including a shadcn primitive that has never heard of this
design system — picks it up.

Two rules worth knowing before editing it:

- **Type styles live in `@layer components`, not `@utility`.** They use the
  `font:` shorthand, which resets weight, size, family and leading together. A
  custom utility sorts *after* Tailwind's own, so `type-body-sm font-semibold`
  would silently render at weight 500. In the components layer, utilities win.
- **Breakpoints must be declared in a plain `@theme` block.** `@theme inline`
  does not register them, so `--breakpoint-wide` there generates no `wide:`
  variant at all.

### Adding a listing

A listing is a `ListingDefinition`: its collection, title, filter facet,
columns, and how one record looks as a card. `ListingView` renders the rest —
header, toolbar, table or cards, filter surface, pager, and the loading, empty
and error states. See `components/entities/process-listing.tsx`.

Columns marked `secondary` are dropped in the compact layout (700–1199px),
where keeping them would squeeze the name column to an ellipsis.

### Adding a state colour

`components/cortex/tones.ts` is the only place a domain value becomes a colour.
Nothing else in the app maps one to a class.

## Layouts

| Width | Shape |
| --- | --- |
| ≥ 1200 | sidebar with labels and count chips, full table |
| 700–1199 | sidebar collapsed to icons, secondary columns dropped |
| < 700 | bottom tab bar, card listings, filter sheet, stop confirmation |

`hooks/use-layout.ts` and the `wide:` Tailwind variant read the same numbers.

## Themes

Light and dark are of equal standing; light is the default. The toggle flips a
single `dark` class on `<html>` and every token follows — no component branches
on the theme. The choice is persisted, and an unset one follows the OS.

## Design source

`design/` holds the design system this was built from: tokens, component
contracts, and two runnable prototypes. The prototypes are the arbiter when the
handoff README and the rendered design disagree. They are reference material,
not production code — nothing in `src/` imports from there except the brand
mark, which is inlined in `components/cortex/brand-lockup.tsx` so it picks up
the brand colour in either theme.
