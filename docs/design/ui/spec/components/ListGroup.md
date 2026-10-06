# ListGroup
Purpose: titled section of list rows with optional add button (`group(title, items, add)`).
Source (states): drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
Header: overline title left, optional 28px icon button right (e.g. aria-label "New dataset"). Items stack gap 2px.

## Variants
`add`: boolean (shows icon button).

## Sizes
Header min-height 22px, padding 0 10px 4px. Icon button 28px (--size-control-sm), radius --radius-8, transparent bg, color --color-mute.

## States (drawn on DS-States / DS-Dark-States)
- expanded: header = overline title + add IconButton (ghost sm 28, `plus` 14, `--color-mute`); no chevron is drawn on the expanded header.
- add hover: bg `--color-soft`, icon `--color-ink`.
- add focus-visible: outside ring `--shadow-focus-ring`; add disabled: 45%, not-allowed, no hover.
- collapsed: header shows `chevron-right` 11 (stroke 1.8, `--color-mute`) before the title, gap `--space-4`, and the title carries the item count ("API · 2"); rows hidden. Rule (page): headers collapse when a list is long (more than 8 items).
Group rows follow ListItem state rules (drawn sample: NodeTile 28 neutral hue `api` icon 15, title 500, subtitle 11.5 `--color-mute`, trailing StatusDot 8 `--color-ok-dot`).

## Props
```ts
type ListGroupProps = { title: string; addLabel: string | null; onAdd: (() => void) | null; collapsed: boolean; onCollapsedChange: ((collapsed: boolean) => void) | null; count: number; children: ReactNode };
```

## Tokens
Title: 11px/600 uppercase tracking .06em = --type-overline + letter-spacing .06em + --tracking-overline color --color-mute. Container card radius --radius-12 padding --space-8.

## Accessibility
`role="group"` with `aria-labelledby` title; add button needs aria-label.

## Light/dark
Token-driven (dark values in tokens.md).

## Used by
DS-Data: "Datasets" (SubnavItem rows), "Actions" (PaletteItem rows, no add).
