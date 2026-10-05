# Meter
Purpose: labelled horizontal bar for a measurement against a total (cost by model, quality 8/10). This is the horizontal-bar component the Data page uses; `bar_x` in the design is only a helper returning a bar's x position, not a chart.
Page: DS-Display (Numbers). Legend, two-series chart and the palette belong to Legend, LineChart, BarChart.

## Anatomy
stack (gap `--space-5`) > label row (flex, space-between, `--type-body-small`: label left, value right with tabular-nums) + track (8px, radius `--radius-4`, bg `--color-soft`) > fill (width %, accent).

## Variants
Fill `--chart-1` (alias of `--color-accent`) as drawn; `color` defaults to `ChartColor.Chart1` (ChartColor enum in Legend) (84% for "Strong model · platform  $39.10"). Several meters stacked use `--space-12` between them. Fill colour: `--chart-1` (= `--color-accent`) for single-series meters (drawn on DS-Patterns > Charts "meter list": card 320, padding 16, gap 12, three meters "Asked for a person 48 / 44%", "Complaint 31 / 28%", "Answer not in knowledge 22 / 20%", label row 12.5, track 8 radius 4 soft, fill radius 4). Other series colours `--chart-2..4` (tokens.md); the page draws meters in chart-1 only.

## States
Static, not interactive. UNDESIGNED: hover tooltip on a bar. Proposal: native `title` or ChartTooltip only if bars are truncated.

## Props
```ts
type MeterProps = { label: string; value: number; max: number; valueLabel: string; color: ChartColor }
```

## Accessibility
`role="meter"` with `aria-valuenow/min/max` and `aria-labelledby` the label; value text is visible, so colour is never the only signal. Not Radix Progress (it is a measurement, not task progress).

## Light/dark
Token-driven; drawn on DS-Dark-Display: track `--color-soft` #2A2824, fill `--color-accent` #4DB6AE, label/value `--color-ink` #ECE8E1, card #211F1C / #34312C. DS-Dark-Patterns meter list: track #2A2824, fill #4DB6AE, label/value #ECE8E1, card #211F1C / #34312C (same as DS-Dark-Display).

## Used by
Analytics cost breakdown, quality score.

## Differs from existing
New. Replaces the old Progress `valueLabel` row.
