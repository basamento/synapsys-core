# Synapsys Cortex — Design System

Cortex is the operator console for **Synapsys**: a control plane where workers connect, register long-running *processes*, and receive commands. An operator watches five views — Summary, Workers, Processes, Executions, Actions — and issues two commands: start and stop. Everything else on screen exists to answer one question: *is the core still answering, and did the worker acknowledge?*

This design system replaces the console's stock look with a deliberate one, in two themes of equal standing: a light "daylight" theme for desk use and a dark theme for night operations. It covers tokens, components, and full-screen recreations for **desktop** and **mobile**.

## Sources

| Source | What was taken from it |
| --- | --- |
| Local codebase `frontend/` (React 19 + Vite + Tailwind v4 + shadcn/ui, `lucide-react` icons) | Component inventory, entity model (`src/types/entities.ts`), page structure, copy, the five nav entries and their lucide icons, the 5-second poll behaviour |
| Screenshots of the running app (Summary, Workers, Processes, Executions, Actions) | Page shape, data density, what each view lists |
| `Direction B - Panels.dc.html`, `Direction C - Daylight.dc.html` (in the parent design project) | The chosen visual direction: B became the dark theme, C the light theme |

The codebase shipped stock shadcn slate tokens and no brand assets. Colour, type and shape here are the design decision; structure and naming follow the code.

## Index

- `styles.css` — the one file consumers link. Imports everything below.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `shape.css`, `base.css`
- `components/primitives/` — Button, Badge, Card + CardHeader, Input, Separator, Progress, Skeleton, Spinner, Icon
- `components/overlays/` — Dialog, DropdownMenu, Tooltip, Sheet
- `components/navigation/` — TopBar, SideBar, TabBar, ModeToggle, Breadcrumb, Pagination, ListingPagination
- `components/monitor/` — CoreStatusIndicator, SyncCountdown, StateBadge, MetricTile, PageHeader, DataTable, MeterRow, StateDonut, ListingShell
- `components/entities/` — ProcessCard, WorkerCard, ExecutionCard, ActionCard (+ `formatters.js`)
- `ui_kits/cortex-console/` — desktop console, all five views, click-through, both themes
- `ui_kits/cortex-mobile/` — the same five views at 390×844, with tab bar, filter sheet and stop confirmation
- `guidelines/` — foundation specimen cards (colour, type, spacing, shape, motion)
- `SKILL.md` — Agent Skills entry point

## Visual foundations

**Colour.** One accent: violet (`#5F3DF2` light, `#6D4AFF` dark) for primary actions, the active nav row, the idle state and the brand meter. Neutrals are tinted, never pure grey: a lilac-grey ramp in light, a blue-black ramp in dark. Four state colours are fixed and never reassigned — running teal, idle violet, stopping amber, failed red. Max two background planes per screen (canvas + card), with a third *sunken* plane for tiles inside cards.

**Type.** Three families. Bricolage Grotesque 700 at −0.03em tracking for page titles and big numbers; Manrope 500/600/700 for all UI text; IBM Plex Mono for anything a machine produced — ids, hosts, timestamps, tokens, and the uppercase eyebrow labels (10.5px, 0.12em). The mono/sans split is the system's most legible rule: if a human wrote it, it is Manrope; if the core reported it, it is mono.

**Backgrounds.** Flat colour only. No gradients (the one exception is the conic-gradient state donut), no imagery, no texture, no patterns. The console is a monitoring surface; ornament competes with signal.

**Shape.** Radii 5 / 8 / 10 / 12 / 16 and pill. Cards and tables 12, sheets and dialogs 16, buttons 8–10, badges pill. Borders are always 1px hairlines in `--border`; a card is border + one soft shadow, never a heavy drop.

**Elevation.** Four steps: card (resting), raised (pulled forward), overlay (dialogs, sheets, menus), plus a violet glow under brand buttons and the active nav row. Dark theme uses the same four steps at higher opacity.

**Transparency and blur.** Only two places: the modal scrim (ink at 50%) and a 3px backdrop blur behind dialogs. No frosted panels, no translucent cards.

**Motion.** 120ms for hover, press and tint; 180ms for width, height and position; one easing curve, `cubic-bezier(.2, 0, .2, 1)`. Three looping animations exist and only signal liveness: the `checking` status dot pulses (1.4s), the spinner turns (720ms), skeletons shimmer (1.4s). Nothing bounces, springs, scales in, or parallaxes.

**Hover and press.** Hover brightens a filled button ~6% and tints a row or card to the *subtle* surface. Focus is a brand border plus a 3px translucent brand ring — never the browser outline. Disabled is 45% opacity with the footprint kept, so a row's buttons never shift as state changes.

**Layout.** Desktop: 58px full-bleed top bar with a bottom hairline, a 210px sidebar on the canvas (not in a card), 22px/20px shell padding, 20px column gap, 50px table rows. Mobile: 54px top bar, 16px page padding, 62px bottom tab bar, 44px minimum tap target, single column, two-up metric tiles.

**Density.** Between the source app and a trading terminal. Desktop listings are tables (10 rows visible without scrolling); the source app's one-card-per-row is kept for mobile and detail views, where a table cannot work.

## Content fundamentals

- **Voice: flat and factual.** The UI states what the core reported and stops. "One worker has not acknowledged its desired token." No reassurance, no exclamation, no personality.
- **Machine states stay lowercase**, exactly as the API spells them: `idle`, `running`, `stopping`, `failed`, `waiting`, `synced`, `done`. Human-facing labels are Title Case: `Endless`, `Spring Boot`, `Last touch`.
- **Page titles are the plural noun**, nothing more: Processes, Workers, Executions, Actions, Summary.
- **Meta lines carry counts and freshness, separated by `·`**: "200 total · 10 on this page · polled 4 seconds ago". The meta line is the page description; no paragraph follows it.
- **Eyebrow labels are two words maximum**, uppercase mono: LAST TOUCH, FRAMEWORK, COMMAND QUEUE.
- **Buttons are verbs**: Start, Stop, Retry, Refresh, Logs. Destructive confirmations name the target: "Stop endless process 10?"
- **Numbers are never dressed up.** No "+12% vs last hour", no sparklines, no invented deltas — the core does not report them.
- **Second person only when addressing the operator's own action** ("Apply", "Show idle + running"). No first person, ever.
- **No emoji.** Not in labels, not in empty states.
- **Empty states name the fact and the cause**: "No processes yet." / "Core unavailable."

## Iconography

The app uses **Lucide** (`lucide-react` in `package.json`), so the design system uses Lucide too — no second icon set. The repo contains no icon assets to copy, so icons are pulled from `lucide-static` on the CDN (`https://unpkg.com/lucide-static@0.544.0/icons/<name>.svg`) and inlined so `currentColor` still applies; `components/primitives/Icon.jsx` is the only place that touches icon markup. **Flag:** if the product later vendors its own icon sprite, replace the CDN base in `Icon.jsx` and nothing else changes.

Rules: 16px in rows, nav and buttons; 19–20px in tab bars and metric tiles; stroke weight 1.9, raised to 2–2.1 for the active state. Icons are always `--text-faint` or `--text-muted` unless they sit on the brand fill, where they are white. Never colour an icon with a state colour — the badge carries state. No emoji, no unicode glyphs standing in for icons.

The five nav icons are the ones the app already imports: `bar-chart-3`, `pc-case`, `loader-circle`, `play-square`, `history`.

## Brand assets

**Nucleus mark** — a soma with three axons, each ending in a teal terminal: one core, three workers reaching out from it. Four files in `assets/`: `synapsys-mark.svg` (primary, used in the TopBar lockup), `synapsys-mark-mono.svg` (one colour via `currentColor`, for print or dark-on-anything placement), `synapsys-mark-plain.svg` (no badge circle, transparent ground), `synapsys-favicon.svg` (heavier strokes for 32px and below, where the primary mark's axon greys out). Sizing, clear space and misuse rules are in `guidelines/brand-lockup.html`.

## Intentional additions

The source defines these components; everything here maps to something real in `frontend/src`, with three exceptions:

- **Icon** — a wrapper the source gets for free from `lucide-react`; needed here because this system is framework-agnostic.
- **TabBar** — the source app has no mobile navigation at all. Mobile was part of this brief, so the five views needed a bottom bar.
- **DataTable** — the source installed `ui/table.tsx` and `@tanstack/react-table` but rendered listings as stacked cards. Desktop listings now use the table, per the brief's licence to improve the shape.

Not built, because the source does not define them: toast, avatar menu, tabs, accordion, command palette, date picker.

## Known gaps

- No real font files: Bricolage Grotesque, Manrope and IBM Plex Mono load from Google Fonts. If brand fonts exist, swap `tokens/fonts.css` for local `@font-face` rules.
- The source app's `sidebar.tsx` collapse-to-icon behaviour is not modelled; the design system's SideBar is the expanded state only.
- Process detail and execution detail pages do not exist in the source, so none were invented — `Breadcrumb` is there for when they do.
