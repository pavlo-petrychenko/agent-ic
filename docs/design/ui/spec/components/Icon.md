# Icon
Purpose: render one icon from the shared 16px outline set.
Pages: DS-Foundations (Icons grid, hue tiles, callouts, header logo); used everywhere.
Anatomy: inline svg, `viewBox="0 0 16 16"`, `fill="none"`, `stroke="currentColor"`, stroke-linecap/linejoin round, `aria-hidden="true"`, and `data-icon="<name>"` on every svg.

## Variants
`name` enum of 61 (kebab-case, exactly as on the page): agent, alert, api, arrow-down, arrow-up, bolt, box, cal, channels, chart, check, chevron-down, chevron-right, code, compl, copy, drag, esc, filter, flask, gear, hand, home, hour, image, inbox, info, kb, key, keyboard, link, lock, logo, minus, monitor, moon, more, msg, note, panel, par, pause, play, plus, refresh, router, search, send, sort, sparkle, spinner, star, sun, tool, tool-event, traces, upload, user, var, wait, x.
Renamed: toolev -> tool-event, chev -> chevron-down, chevr -> chevron-right, kbd -> keyboard. New: moon, monitor, spinner, sort, arrow-up, arrow-down, image, copy.
`data-icon` is how an icon is identified once SVG paths are stripped (exports, tooling, tests: `[data-icon="moon"]`). The component always renders it; the name enum is the single list, kept in `shared/ui/foundations/Icon/icon.constants.ts` with path data per name.

## Sizes
`size` number 11-18 px (hue tiles 14-15 inside 28, Callout 14, icon grid 18, mini 11 in chat meta). Stroke 1.5 default; the header logo tile uses 1.8 at 15.

## States
Inherits colour via currentColor; no own hover/focus/disabled. `spinner` is an open arc (270 degrees): rotation speed is UNDESIGNED (proposal: 800ms linear infinite); under `prefers-reduced-motion` spinners keep turning (design rule).

## Props
```ts
type IconProps = { name: IconName; size: number; strokeWidth: number; title: string | null }
```
Decorative when `title` is null.

## Tokens
Colour by currentColor; grid cell sample uses `--color-ink` on `--color-card`, 1px `--color-line`, radius 8; label 10.5 mono `--color-mute`. Hue-tile default icons: see tokens.md hue table.

## Accessibility
`aria-hidden="true"` unless `title` is given, then `role="img"` + `<title>`. Icon-only controls name themselves through their button `aria-label`. No Radix.

## Light/dark
No change (currentColor).

## Repo diff
No Icon in shared/ui; path data must be extracted from the DS-Foundations SVGs (read by `data-icon`). The moon gap from v1 is closed: moon and monitor are designed for ThemeToggle.
