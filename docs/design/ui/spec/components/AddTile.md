# AddTile
Purpose: dashed affordance at the end of a list or grid to add an item.
Source: DS-Actions v2 (Add tile). States: drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
root button > `plus` icon (13px in row, 18px in tile) > label > optional sub text (tile only).

## Variants
- row: height 40 (`--size-control-lg`), width 100%, horizontal, gap `--space-6`, label 13px `--type-body`, colour `--color-ink-secondary`.
- tile: width 100%, min-height 120 (local constant), padding `--space-16`, column, gap `--space-8`, centred; label 600 (`--type-title`), sub `--type-caption` `--color-mute`.
Both: transparent bg, `--border-width-dash` (1.5px) dashed `--color-line-dash`, radius `--radius-12`.

## States (drawn on DS-States for the row layout; the tile layout uses the same rules)
- default: above.
- hover: bg `--color-soft`, border colour `--color-edge` (stays 1.5px dashed), text `--color-ink`.
- active (pressed): bg `--color-chip`, border `--color-edge`.
- focus-visible: outside ring with 2px gap (`--shadow-focus-ring`), radius follows `--radius-12`.
- disabled: global rule (0.45, not-allowed, no hover/focus).
- drag-over / loading: n/a.

## Props
```ts
enum AddTileLayout { Row = 'row', Tile = 'tile' }
type AddTileProps = ComponentProps<'button'> & { label: string; sub: string | null; layout: AddTileLayout }
```

## Accessibility
Native button; the text is the name. No Radix.

## Light/dark
Token-driven (`--color-line-dash` has a dark value).
