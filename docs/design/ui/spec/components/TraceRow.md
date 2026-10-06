# TraceRow
Purpose: tree row for one step of a run trace (`trace_row(depth, kind, icon, name, dur, sel)`).
Source (states): drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
Link row: indent guides (depth 0 none; depth 1 = 16px wide cell with left border 1px, margin-left 8px) | kind NodeTile 22px | name | duration (mono, right).

## Variants
- `kind` tile hue: agent/model violet (--color-violet-light/--color-violet), tool = hue tool, completion = hue compl (icon `compl`), knowledge = hue kb; model rows use the `sparkle` icon. Bar hue in TimelineRow = same step hue solid.
- `depth`: 0 | 1 (more via repeated guides).
- duration: `2.1 s` | `running…`.

## Sizes
Height 36px, padding 0 16px 0 10px, gap --space-8, tile 22 radius --radius-6. Name --type-body (13px) weight 400, selected 600.

## States (drawn on DS-States / DS-Dark-States unless marked)
- default: transparent, name 400.
- hover: bg `--color-soft`.
- selected: bg `--color-accent-light` + inset 2px `--color-accent` bar + name weight 600.
- focus-visible: inset 2px accent ring (`--shadow-focus-ring-inset`).
- collapsed parent: a `chevron-right` 11 (`--color-mute`) takes the place of the indent guide before the tile (expanded parent, decided: `chevron-down`).
- error step: the duration is replaced by the error word in mono 11.5 `--color-err` ("timeout"); no `alert` icon and no row tint.
- running (decided): `spinner` beside the duration text "running…".
- disabled: 45%, no hover/focus (not drawn).

## Props
```ts
type TraceRowProps = { depth: number; kind: TraceStepKind; icon: ReactNode; name: string; durationLabel: string | null; errorLabel: string | null; running: boolean; expanded: boolean | null; selected: boolean; onSelect: () => void };
```

## Tokens
guide border --color-line; duration --type-mono-sm color --color-mute.

## Accessibility
Tree: `role="tree"`/`treeitem`, `aria-level={depth+1}`, `aria-selected`; Arrow keys; roving tabindex.

## Light/dark
All 18 step hues have dark values (tokens.md); no extra work.

## Used by
DS-Data (Trace rows); Traces, Traces-Timeline.
