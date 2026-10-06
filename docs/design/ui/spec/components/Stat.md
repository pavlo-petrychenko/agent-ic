# Stat
Purpose: stat tile: label, big number, sub label.

## Anatomy
Card(pad 14 vertical, 16 horizontal, gap 4; demo width 200) > label 12px `--color-mute` + value 24/600 (`--type-display`, `--tracking-tight`, tabular-nums) + sub 12px `--color-mute`.

## States
Static. UNDESIGNED: delta/trend and loading. Proposal: Skeleton for value; trend as Badge ok/err.

## Props
```ts
type StatProps = { label: string; value: string | number; sub: string | null }
```

## Accessibility
Group with label association (`dl`/`dt`/`dd` or `aria-labelledby`); tabular-nums for numbers. No Radix.

## Light/dark
Token-driven.

## Used by
Dashboard, analytics.
