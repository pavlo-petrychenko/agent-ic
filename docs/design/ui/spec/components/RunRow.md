# RunRow
Purpose: trace-run list row: status dot, kind icon, title, time, duration, cost, outcome, quality badge (`run_row`).
Source: DS-Data (revised) "Record rows". States: drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
Two lines. Line 1: status dot 8px | kind tile 18px (`--color-dark` bg, `--color-on-dark` `msg` glyph: #2A2723/#FFFFFF light, #3A3631/#F2EEE7 dark) | title (ellipsis, flex-grow) | time. Line 2 (indent 34px, mono 11.5px): outcome/duration/cost spans ... quality pill right.

## Variants
- Status dot: ok `--color-ok-dot` (#2F8A5B), warn/escalated `--color-warn-dot` (#C27B1A), error `--color-err` (#A53428). Dots are brighter than text on purpose: dot 3:1, text 4.5:1. Dark values are in tokens.md.
- Line 2 content: `2.9 s  $0.007` | `escalated  0.7 s` | error text (`API timeout`).
- Quality pill: violet (--color-violet-light/--color-violet), mono 11px, no dot.

## Sizes
Padding 10px 16px, row gap --space-4, line gap --space-8/--space-10. Title --type-body-small (12.5px).

## States (drawn on DS-States / DS-Dark-States unless marked)
- default: transparent.
- hover: bg `--color-soft`.
- selected: bg `--color-accent-light` + inset 2px `--color-accent` bar.
- error (`failed`): only the status dot changes, to `--color-err` (row bg and text unchanged).
- running (decided): the status dot is the pulsing accent `run` dot; the detail line carries the "running…" text.
- focus-visible: inset 2px accent ring (`--shadow-focus-ring-inset`).
- disabled: 45% opacity, no hover/focus, not-allowed (not drawn).
- loading/empty (decided and built): `RunRowsSkeleton` draws 3 placeholder rows after the Skeleton delay; EmptyState when the list is empty (the filtered variant after filtering).
Built as a TanStack Router link (`to`). The status dot is an `img` named by `statusLabel`; `quality` arrives already formatted.

## Props
```ts
type RunStatus = 'running' | 'ok' | 'escalated' | 'failed';
type RunRowProps = { to: string; title: string; time: string; dateTime: string; status: RunStatus; statusLabel: string; detail: readonly string[]; triggerIcon?: IconName | null; quality?: string | null; selected?: boolean };
type RunRowsSkeletonProps = { label: string; count?: number };
```

## Tokens
mono line --type-mono-sm; border-bottom --color-line-row; time --color-mute --type-small; kind tile bg --color-dark (`trig`-style dark tile) radius --radius-6.

## Accessibility
Link with `aria-current="page"`; status dot is named by `statusLabel` ("Succeeded"/"Escalated"/"Failed").

## Light/dark
Drawn on DS-Dark-Data: kind tile #3A3631 / glyph #F2EEE7; dots ok #4CB884, warn #D9963A, err #F08A7C (all tokens.md dark values).

## Used by
DS-Data (Record rows). Traces list at left of the trace views.
