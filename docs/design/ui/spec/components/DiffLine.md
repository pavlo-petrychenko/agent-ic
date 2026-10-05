# DiffLine
Purpose: one line of a change summary with a sign (+ added, ~ changed, - removed).

## Anatomy
row (flex, gap 8, padding 4px 0, 12.5px) > sign (mono, 12px wide, shrink 0) + text (`--type-body-small`, names in strong).
Signs: + `--color-ok`, ~ `--color-warn`, - (minus sign U+2212) `--color-err` (text colours, not dot colours).

## States
Static.

## Props
```ts
enum DiffSign { Added = 'added', Changed = 'changed', Removed = 'removed' }
type DiffLineProps = { sign: DiffSign; children: ReactNode }
```

## Accessibility
Sign is decorative; add visually-hidden "Added" / "Changed" / "Removed". `li` in a list. No Radix.

## Light/dark
Token-driven.

## Used by
Publish diff, version compare (inside Card pad 16).
