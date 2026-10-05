# TableCell
Purpose: single-line text cell inside a Table row (`cell(t, align, tone, mono_)`).

## Anatomy
One `span`: text, ellipsis on overflow, `min-width:0`.

## Variants
- `tone`: `ink` (--color-ink) | `secondary` (design name `ink2`, --color-ink-secondary used for numbers) | `mute` (--color-mute). Observed: primary text = ink, descriptive = mute, numbers = ink-secondary.
- `align`: `start` | `end`.
- `mono`: boolean, uses mono font.

## Sizes
Single: --type-body-small (12.5px) sans; mono = --type-mono (12px). `font-variant-numeric: tabular-nums` always.

## States
None (static). Truncation via `overflow:hidden; text-overflow:ellipsis; white-space` implied (no nowrap in markup beyond ellipsis; add nowrap).

## Props
```ts
type TableCellProps = { children: ReactNode; align: 'start'|'end'; tone: 'ink'|'secondary'|'mute'; mono: boolean };
```

## Tokens
colour per tone; typography --type-body-small / --type-mono; tabular-nums has no token (utility).

## Accessibility
Render as `td`. Numeric columns end-aligned.

## Light/dark
Token-driven; dark values exist for ink, ink-secondary and mute (tokens.md).

## Used by
Table in DS-Data; values: case name, expected behaviour, score (mono "3.0"), channel, synced time, run id (mono `run_8f3a21`).
