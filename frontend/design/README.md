# Handoff: Synapsys Cortex UI restyle (desktop + mobile)

## Overview

Cortex is the Synapsys operator console: workers connect, register long-running processes, and receive start/stop commands. Five views — Summary, Workers, Processes, Executions, Actions — poll the core every 5 seconds.

This package restyles all five views and adds a mobile design (the current app has none). It ships two themes of equal standing: a light "daylight" theme (default) and a dark theme for night operations, switched by a class on `<html>`.

## About the design files

**The HTML in `prototypes/` is a design reference, not production code.** It is a self-contained React-in-the-browser prototype whose only job is to show intended look and behaviour precisely. Do not copy it into the app.

The target codebase is the existing `frontend/` app: **React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui + lucide-react + react-router-dom**. The job is to recreate these designs there, using its established patterns — keep `src/components/ui/*` as the primitive layer, keep the page/router structure, keep `useAppData`/`useProcesses` and the 5s poll. What changes is tokens, layout and the listing shape.

The `design-system/` folder is the reference implementation: CSS custom properties that are the source of truth for every value, plus framework-agnostic React components (`.jsx` + `.d.ts` + `.prompt.md`) documenting each component's contract and states. Read the `.jsx` for exact numbers; port the intent into shadcn components rather than dropping these files in.

## Fidelity

**High fidelity.** Colours, type, spacing, radii, shadows, motion and copy are final. Recreate pixel-for-pixel. The prototypes are the arbiter: when this README and a prototype disagree, the prototype wins.

## What to change in the existing codebase

| Area | File(s) today | Change |
| --- | --- | --- |
| Tokens | `src/index.css` | Replace the stock shadcn slate `:root` / `.dark` blocks with the mapping below. Keep the `@theme inline` block; keep `--radius` at `0.625rem` (10px). |
| Fonts | none loaded | Add Bricolage Grotesque, Manrope, IBM Plex Mono; set `--font-sans: Manrope`, `--font-mono: "IBM Plex Mono"`, `--font-display: "Bricolage Grotesque"`. |
| Top bar | `layout/top-bar.tsx` | Stop floating it in a card: full-bleed, 58px, bottom hairline. Add the Synapsys/Cortex lockup, keep `CoreStatusIndicator`, `SyncCountdown`, `ModeToggle`; add an initials avatar. |
| Sidebar | `layout/side-bar.tsx`, `ui/sidebar.tsx` | Drop the floating variant; 210px column on the canvas, brand-filled active row, mono count chips, plus a command-queue card underneath. |
| Listings | `listing/listing-shell.tsx`, `*-card.tsx` | Desktop: render `ui/table.tsx` (the dep is already installed, unused) at 50px rows. Keep the cards for mobile and detail views. |
| Pagination | `listing/listing-pagination.tsx` | Move into the table footer; page-size becomes a 10/25/50 segmented control (not a dropdown). |
| Page headers | `layout/*-header.tsx` | One shared `PageHeader`: display title + single meta line + actions (search, filter chip, Refresh). |
| State colours | `process-card.tsx`, `execution-card.tsx`, `summary-page.tsx` | Delete every hard-coded `bg-green-600`/`bg-blue-600`/`bg-violet-600`/`bg-amber-600` and the `stateColors` map; use one `StateBadge` driven by tokens. |
| Mobile | — | New: bottom tab bar, card listings, bottom filter sheet, stop confirmation dialog. `hooks/use-mobile.ts` already exists for the breakpoint. |

### shadcn token mapping

Set these in `src/index.css`. Light values first, dark in `.dark`.

| shadcn var | Light | Dark |
| --- | --- | --- |
| `--background` | `#F4F2FA` | `#0A0C11` |
| `--foreground` | `#3A3550` | `#D4D7E2` |
| `--card` | `#FFFFFF` | `#0F1219` |
| `--card-foreground` | `#14121F` | `#FFFFFF` |
| `--popover` | `#FFFFFF` | `#0F1219` |
| `--primary` | `#5F3DF2` | `#6D4AFF` |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` |
| `--secondary` | `#EDEAF6` | `#131722` |
| `--secondary-foreground` | `#3A3550` | `#D4D7E2` |
| `--muted` | `#FAF8FF` | `#141822` |
| `--muted-foreground` | `#7C7594` | `#7B819A` |
| `--accent` | `#F2EFFF` | `#251E52` |
| `--accent-foreground` | `#4A2BD0` | `#C4B0FF` |
| `--destructive` | `#D9453E` | `#F0736C` |
| `--border` | `#E8E5F2` | `#1A1E28` |
| `--input` | `#E8E5F2` | `#232836` |
| `--ring` | `#5F3DF2` | `#9E86FF` |
| `--chart-1..4` | teal `#12B5A0`, violet `#5F3DF2`, amber `#E0A63C`, red `#D9453E` | `#12B5A0`, `#6D4AFF`, `#E0A63C`, `#F0736C` |
| `--sidebar` | `#F4F2FA` | `#0A0C11` |
| `--sidebar-primary` | `#5F3DF2` | `#6D4AFF` |

Add these beyond shadcn's set (they carry meaning shadcn has no slot for): `--surface-subtle`, `--surface-sunken`, `--text-heading/body/muted/faint`, the four `--state-*-bg/fg/dot` triplets, `--shadow-card/raised/overlay/brand`. Copy them verbatim from `design-system/tokens/colors.css` and `shape.css`.

## Design tokens

### Colour — brand and state

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| brand | `#5F3DF2` | `#6D4AFF` | primary button, active nav, idle state, brand meter |
| brand hover | `#4A2BD0` | `#7D5CFF` | hover on filled brand |
| brand soft / soft text | `#F2EFFF` / `#4A2BD0` | `#251E52` / `#C4B0FF` | current page chip, avatar, filter count |
| running | bg `#E9F7F4` fg `#0B7767` dot `#12B5A0` | bg `#0E3B33` fg `#12B5A0` | running, active, done, synced |
| idle | bg `#F2EFFF` fg `#4A2BD0` dot `#5F3DF2` | bg `#251E52` fg `#9C94C6` dot `#6D4AFF` | idle |
| stopping | bg `#FFF8EC` fg `#8A5806` dot `#E0A63C` | bg `#3B2A0E` fg `#E0A63C` | stopping, waiting |
| failed | bg `#FBE6E5` fg `#A62A25` dot `#D9453E` | bg `#3D1614` fg `#F0736C` | failed, destructive |

The four state colours are fixed. Never reassign them, never colour an icon with them (the badge carries state).

### Colour — surfaces and text

Light: canvas `#F4F2FA`, card `#FFFFFF`, subtle `#FAF8FF`, sunken `#EDEAF6`, border `#E8E5F2`, border-strong `#A9A4BE`, heading `#14121F`, body `#3A3550`, muted `#7C7594`, faint `#7C7594`.

Dark: canvas `#0A0C11`, card `#0F1219`, subtle `#141822`, sunken `#131722`, border `#1A1E28`, border-strong `#232836`, heading `#FFFFFF`, body `#D4D7E2`, muted `#7B819A`, faint `#6E7489`.

Light `faint` deliberately equals `muted` (`#7C7594`, 4.6:1 on white) because it carries operational data — hosts, ids, timestamps. Do not lighten it.

### Typography

| Token | Value | Use |
| --- | --- | --- |
| display-lg | Bricolage Grotesque 700 34px/1.1, −0.03em | biggest numbers |
| display | Bricolage Grotesque 700 27px/1.15, −0.03em | page titles (desktop) |
| display-sm | Bricolage Grotesque 700 21px/1.2, −0.03em | panel numbers, mobile titles (24px) |
| title | Manrope 700 15px/1.35 | card titles, panel headings |
| body-lg | Manrope 500 14px/1.45 | nav items, row names |
| body-md | Manrope 500 13px/1.5 | default UI text, table cells |
| body-sm | Manrope 500 12.5px/1.5 | meta lines, pagination |
| caption | Manrope 500 12px/1.5 | badges |
| eyebrow | IBM Plex Mono 500 10.5px, 0.12em, uppercase | column heads, tile labels, nav group label |
| mono-md | IBM Plex Mono 400 12px | timestamps, counts in prose |
| mono-sm | IBM Plex Mono 400 11px | ids, hosts, token pairs |

Rule: human-written text is Manrope, machine-reported text is mono.

### Spacing, shape, motion

Spacing scale: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 26, 32. Odd values are intentional — do not snap to a 4/8 grid.

Layout: shell padding 22px x / 20px y · column gap 20px · sidebar 210px · top bar 58px · table row 50px · card padding 18px 20px. Mobile: page padding 16px · top bar 54px · tab bar 62px · min tap 44px.

Radii: 5 (chips inside controls), 8 (buttons sm, nav rows, small squares), 10 (buttons default, inputs, tiles), 12 (cards, tables), 16 (dialogs, sheets), pill (badges, dots, avatars). Borders are always 1px.

Shadows — light: card `0 6px 18px rgba(20,18,31,.05)`, raised `0 10px 26px rgba(20,18,31,.08)`, overlay `0 18px 44px rgba(20,18,31,.14)`, brand `0 6px 18px rgba(95,61,242,.28)`. Dark: card `0 12px 32px rgba(0,0,0,.32)`, raised `0 16px 38px rgba(0,0,0,.42)`, overlay `0 24px 56px rgba(0,0,0,.55)`, brand `0 6px 18px rgba(109,74,255,.32)`.

Motion: 120ms for hover/press/tint, 180ms for size/position, easing `cubic-bezier(.2, 0, .2, 1)` everywhere. Only three loops, all liveness signals: status-dot pulse 1.4s (`checking` only), spinner 720ms, skeleton shimmer 1.4s. Nothing bounces, springs, scales in or parallaxes.

## Screens — desktop (1440×900)

Shell for every view: full-bleed top bar (58px, card surface, bottom hairline) → row with 22px/20px padding and 20px gap → 210px sidebar column + fluid content column.

**Top bar.** Left: the Nucleus mark (`synapsys-mark.svg`, 25px), "Synapsys" (Bricolage 800, 17px, −0.025em, heading colour) and "CORTEX" (mono eyebrow, faint). Right, 14px gaps: core-status pill (tinted, 6px dot, "Core online") · sync countdown (124px column: "heartbeat" eyebrow + mono "4s", 4px brand meter at 62%) · 32px outline square theme toggle (moon/sun) · 32px brand-soft circle with initials.

**Sidebar.** "MONITOR" eyebrow (2px 12px 10px padding), then five rows: 9px/12px padding, 8px radius, 11px gap, 16px lucide icon, 14px label. Active row = brand fill, white text/icon, semibold, brand shadow. Count chip right-aligned: mono 11px, sunken bg (`rgba(255,255,255,.2)` on the active row), 1px 7px, 5px radius. Nav: Summary `bar-chart-3`, Workers `pc-case`, Processes `loader-circle`, Executions `play-square`, Actions `history`. Below, 16px down: command-queue card (card surface, 12px radius, 15px padding) with eyebrow, big display number + "pending", 4px meter, one muted sentence.

**Page header.** Display 27px title; meta line body-md muted, facts joined by `·`: "200 total · 10 on this page · polled 4 seconds ago". Actions row (9px gaps): 204px search field (card surface, 1px border, 10px radius, 9px/13px padding, 14px `search` icon, muted placeholder) · filter chip with brand-soft count badge · brand "Refresh" button (38px, 10px radius, brand shadow).

**Listing table.** Card surface, 1px border, 12px radius, overflow hidden, card shadow. Header strip: 38px, subtle surface, bottom hairline, mono eyebrow column heads at 0.1em; the sorted column is body-coloured with a small brand ▲. Rows: 50px min-height, 20px side padding, hairline between, first row tinted subtle. Footer: 12px/20px padding, subtle surface, top hairline; left "Showing 1–10 of 200" (mono numerals in heading colour); right the 10/25/50 segmented control (3px padding, brand fill on the active chip) and the pager (28px bordered squares for arrows, brand-soft chip for the current page, ellipsis for gaps, first and last page always shown).

Per-view columns:

- **Processes** — Process (name body-lg semibold + mono worker name) · Type 112px (outline pill) · State 116px (state pill) · Framework 124px · Last touch 116px (mono) · Actions 156px right-aligned. Buttons follow state: idle → brand Start + outline Stop(disabled); running → outline Start(disabled) + destructive Stop; stopping → both disabled; failed → brand **Retry** + outline Stop(disabled).
- **Workers** — Worker (name + mono "#1 · HOST") · Framework 124px · First seen 116px · Last seen 116px · Processes 104px · action 104px right ("Processes" outline). Below the table, a "Coverage" panel with four tiles: Host, First connection, Last touch, Heartbeat gap.
- **Executions** — Execution (id + mono "process #200 · run 12") · Status 112px (active → running tone, inactive → neutral) · Current 116px · Desired 132px (outline pill, "desired idle") · Created 112px · Modified 112px · a Logs button opening a dark terminal-styled modal (numbered lines, level pills, per-row and copy-all clipboard actions; failed executions show an indented stack trace).
- **Actions** — Action (28px bordered icon square + "Action #200" + type) · Type 132px (outline pill) · Status 116px (done/waiting/failed tones) · Execution 124px (mono) · Created 124px (mono). Type icons: create `plus-circle`, start `play`, stop `square`, heartbeat `radio-tower`, ack `check-circle-2`.
- **Summary** — no table. Row of four count tiles (label eyebrow, value 14px semibold, hint caption, 20px lucide icon: `cpu`, `layers-3`, `activity`, `boxes`). Then two panels side by side: "Process state" (104px conic-gradient donut, segments always running → idle → stopping → failed, 69% inner hole on card surface showing loaded count + "loaded" eyebrow; legend of four dot rows with mono counts) and "Worker frameworks" (four meter rows with 4px bars). Then two more: "Command queue" (display number + "pending command", `radio-tower` icon, four rows on the sunken surface with mono "desired 4 · ack 4" and a waiting/synced pill) and "Recent actions" (five dense rows: 30px icon square, type label, mono "execution #200 · 18:08:55", status pill).

## Screens — mobile (390×844)

Shell: 54px top bar → scrolling content (16px padding) → 62px bottom tab bar. Overlays are absolute inside the frame.

- **Top bar** — lockup at 16px; right: compact "Online" pill + 32px theme toggle. No countdown, no avatar.
- **Tab bar** — five equal columns, 19px icon over eyebrow label, brand colour + weight 600 when active, each ≥44px tall.
- **Page header** — 24px display title, body-sm meta ("200 total · 10 on this page"), 38px filter button on the right (`sliders-horizontal` + brand-soft count). A 40px search row appears only on the four listing views, never on Summary.
- **Listing cards** — card surface, 12px radius, 14px padding, 12px gaps: title row (title + pills, wrapping), mono identity line, two-up metric tiles, then actions. Process cards end with two full-width 44px buttons (Start/Retry + Stop) following the same state logic. Worker cards end with an outline "View its processes". Execution cards end with an outline "Logs" button opening a bottom sheet (same dark terminal styling as the desktop modal). Action cards have no actions.
- **Pager** — range on the left (mono), 44×40 prev/next squares and "1 / 20" on the right.
- **Filter sheet** — bottom sheet, 16px top radius, 38×4 grab handle, ink-50% scrim: "Filter processes" title, STATE eyebrow with four 38px toggle chips (dot + lowercase label, tinted when on), PAGE SIZE eyebrow with a 10/25/50 segmented control, footer with outline "Reset" (1fr) and brand "Show idle + running" (2fr).
- **Stop confirmation** — centred dialog, 16px radius, ink-50% scrim + 3px blur: "Stop endless process 10?" (display-sm), body "The worker acknowledges within one heartbeat. The process keeps its run id.", outline Cancel + destructive Stop, both 44px and equal width.
- **Summary** — 2×2 count tiles, then the state donut panel (92px donut), command queue (three rows), recent actions (four dense rows).

## Interactions and behaviour

- **Poll** — keep the existing 5s cycle (`SyncCountdown` + `useProcesses.refreshProcesses`, one queued refresh max). The meter runs down over 5s; the meta line's "polled Ns ago" follows the same clock.
- **Theme** — toggle adds/removes `dark` on `<html>`; every token flips, no per-component branching. Persist the choice (the app already has `theme-provider.tsx`).
- **Nav** — router links as today; changing view resets pagination to page 1.
- **Commands** — Start/Stop call the existing process endpoints. Optimistic feedback: the row's state pill goes `stopping`, both buttons disable until the next poll confirms. On mobile, Stop on a *running* process opens the confirmation first; Start never confirms.
- **Sorting** — clicking a sortable column head toggles asc/desc and shows the brand ▲/▼ on that column only.
- **Hover** — rows and cards tint to the subtle surface (120ms); filled buttons brighten ~6%; nav rows tint unless active.
- **Focus** — brand border + 3px `--focus-ring`; never remove the ring, never rely on colour alone.
- **Disabled** — 45% opacity, footprint kept, pointer-events none.
- **Loading** — first load: skeletons matching the real shape (one per element, not one grey block). Refresh: no skeletons, the countdown is the signal. In-flight command: spinner inside the disabled button.
- **Errors** — core unreachable turns the status pill red ("Core offline") with the message in its tooltip; the listing area shows a single centred failed-tone line. Never a toast; the app has no toast system.
- **Empty** — centred muted line, e.g. "No processes yet."
- **Responsive** — ≥1200px: sidebar + tables. 700–1199px: sidebar collapses to icons, tables keep name/state/actions. <700px: the mobile design (tab bar, cards, sheet).

## State

Existing: `useAppData` (workers, processOverviews, executions, actions, pagination per entity, status, error, lastUpdatedAt) and `useProcesses` (start/stop/refresh). No new global state.

New local state per view: `sortKey` + `sortDir`; `search` string; `stateFilter: ExecutionState[]`; mobile `sheetOpen: boolean` and `confirmStop: ProcessOverview | null`; app-level `theme: "light" | "dark"`.

Pagination already exists in `useAppData.pagination[entity]` as `{ page, pageSize, totalItems, totalPages }` — the footer reads it and calls `updatePagination(entity, {...})`.

## Assets

- **Icons: Lucide only** — the app already depends on `lucide-react`, so import from there (the prototypes fetch `lucide-static` SVGs from a CDN purely because they run without a bundler). Named icons used: `bar-chart-3`, `pc-case`, `loader-circle`, `play-square`, `history`, `brain-circuit`, `search`, `sliders-horizontal`, `chevron-left`, `chevron-right`, `moon`, `sun`, `refresh-cw`, `cpu`, `layers-3`, `activity`, `boxes`, `radio-tower`, `check-circle-2`, `plus-circle`, `play`, `square`, `clock-3`.
- **Fonts** — Bricolage Grotesque (600/700/800), Manrope (400–800), IBM Plex Mono (400–600), loaded from Google Fonts in `tokens/fonts.css`. Self-host for production.
- **Logo** — `synapsys-mark.svg` (primary), `synapsys-mark-mono.svg` (currentColor), `synapsys-mark-plain.svg` (no badge), `synapsys-favicon.svg` (≤32px), in `design-system/assets/`. Rules in `design-system/guidelines/brand-lockup.html`.
- No images, illustrations, or background art anywhere in the design. That is deliberate.

## Files in this bundle

```
design-system/
  styles.css              single entry point; imports the six token files
  tokens/                 colors · typography · spacing · shape · fonts · base
  components/             28 components in 5 groups, each .jsx + .d.ts + .prompt.md
    primitives/           Button Badge Card Input Separator Progress Skeleton Spinner Icon
    overlays/             Dialog DropdownMenu Tooltip Sheet
    navigation/           TopBar SideBar TabBar ModeToggle Breadcrumb Pagination ListingPagination
    monitor/              CoreStatusIndicator SyncCountdown StateBadge MetricTile PageHeader
                          DataTable MeterRow StateDonut ListingShell
    entities/             ProcessCard WorkerCard ExecutionCard ActionCard + formatters.js
  guidelines/             17 specimen pages (colour, type, spacing, shape, motion) — open in a browser
  DESIGN_GUIDE.md         visual foundations, content/voice rules, iconography, known gaps
prototypes/
  cortex-console/index.html   desktop, all five views, live theme toggle — open in a browser
  cortex-mobile/index.html    mobile 390×844, tab bar, filter sheet, stop dialog
  */README.md                 per-kit notes on what changed and why
styles.css                path shim so the prototypes resolve tokens inside this folder
```

Open the two `prototypes/*/index.html` files directly in a browser — no build step. The `components/*.card.html` files only render inside the design-system tool (they load a generated bundle); read the `.jsx` beside them instead.

## Suggested order of work

1. Tokens and fonts in `src/index.css` (both themes) — everything else depends on it.
2. Shell: `TopBar`, `SideBar`, `PageHeader` — the frame all five views sit in.
3. `StateBadge` + `MetricTile`, then delete every hard-coded state colour.
4. `DataTable` + table-footer pagination; convert Processes, then the other three listings.
5. Summary panels (donut, meters, command queue, recent actions).
6. Mobile: breakpoint switch, tab bar, card listings, filter sheet, stop confirmation.
7. States: loading skeletons, error, empty, focus rings.
