# ListItem
Purpose: navigation/list row with leading icon tile, title, subtitle and optional trailing status (`list_item`).
Source (states): drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
Link row: NodeTile 28px | stack(title, subtitle) | trailing slot (margin-left auto, e.g. 8px status dot).

## Variants
- Tile hue by entity type: neutral (`--hue-neutral-*`, channel), kb (knowledge), tool (tool/endpoint), agent, ok, compl, api, trig (dark; icon `tool-event`).
- Title: sans 600 selected / 500 unselected; or mono 12px for tool names (`create_booking`).
- Trailing: none | StatusDot (8px, ok = --color-ok-dot; brighter than text on purpose: dot needs 3:1, text 4.5:1).

## Sizes
Padding 7px 10px, gap --space-10, radius --radius-8, tile 28 (--size-tile-md), icon 15px. Container: card, radius 12, padding 8.

## States (drawn on DS-States / DS-Dark-States)
- default: transparent, title 500.
- hover: bg `--color-soft`.
- selected: bg `--color-chip`, title weight 600 (no accent bar here; the accent-light + 2px bar is for record rows).
- focus-visible: inset 2px accent ring (`--shadow-focus-ring-inset`) on the row.
- disabled: colours unchanged at `--opacity-disabled` (45%), no hover/focus, cursor not-allowed.

## Props
```ts
type ListItemProps = { href: string; title: string; subtitle: string | null; icon: ReactNode; tone: ListItemTone; selected: boolean; titleStyle: 'sans'|'mono'; trailing: ReactNode | null };
```

## Tokens
--color-ink title, --type-body; subtitle --type-small --color-mute ellipsis; selected --color-chip; radius --radius-8; text-decoration none.

## Accessibility
`<a>`/router Link, `aria-current="page"` when selected, inside `nav > ul`; trailing StatusDot carries visually hidden text ("Connected").

## Light/dark
All tints, --color-chip and the dots have dark values (tokens.md). Trailing dot needs a text alternative (see a11y).

## Used by
DS-Data (Navigation lists); knowledge sources, tools, channels lists (Settings, agent builder screens implied).
