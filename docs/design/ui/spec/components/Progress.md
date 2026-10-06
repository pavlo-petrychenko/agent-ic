# Progress
Purpose: determinate bar for usage, indexing and quality score. The labelled variant is its own component: see Meter.
Source (states): drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
track (radius `--radius-4`, bg `--color-soft`, overflow hidden) > fill (width %, same radius).

## Variants / sizes
- size: md `--size-bar-md` (8), sm `--size-bar-sm` (4).
- tone: accent (fill `--color-accent`), neutral (fill `--color-edge`), err (fill `--color-err`, drawn on DS-States as the failed state). ok / warn fills: not drawn; success keeps the accent fill (UNDESIGNED for warn, proposal `--color-warn-dot` only where a threshold needs it).
- optional caption below (drawn): 11.5 (`--type-small`) `--color-mute` ("64%") or a status Badge, gap `--space-6`.

## States (drawn on DS-States / DS-Dark-States)
- determinate: md 8 or sm 4, track and fill radius `--radius-4`.
- indeterminate: a 35% wide fill segment slides left to right, 1.4s linear, infinite loop; static (segment at rest) under `prefers-reduced-motion`.
- success: fill 100% `--color-accent` + Badge ok with dot ("Indexed").
- error: fill `--color-err` at the reached value + Badge err with dot ("Failed").

## Props
```ts
enum ProgressTone { Accent = 'accent', Neutral = 'neutral', Err = 'err' }
enum ProgressSize { Sm = 'sm', Md = 'md' }
type ProgressProps = { value: number | null; max: number; size: ProgressSize; tone: ProgressTone; label: string; caption: ReactNode | null }
```

## Accessibility
`role="progressbar"` with `aria-valuenow/min/max` and an accessible name (`aria-label` since no visible label). Radix `Progress` fits (inside `shared/ui`).

## Light/dark
Token-driven (`--color-soft`, `--color-accent`, `--color-edge` have dark values).

## Used by
Indexing progress, usage, wizard steps.

## Differs from existing
No Progress in `shared/ui`.
