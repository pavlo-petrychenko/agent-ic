# Metric
Purpose: inline row of small labelled mono values (latency, tokens, cost) in a step or trace.

## Anatomy
row (flex wrap, gap 24, align end) > item (column, gap 2) > label 11px `--type-hint` `--color-mute` + value `--type-mono` 12px `--color-ink`.

## States
Static. Card wrapper in the demo (pad 16) is not part of the component.

## Props
```ts
type MetricProps = { items: { label: string; value: string }[] }
```

## Accessibility
`dl` with `dt`/`dd`. No Radix.

## Light/dark
Token-driven.

## Used by
Traces, run steps.
