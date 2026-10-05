# Legend
Purpose: row of marker + label items explaining a diagram, timeline or chart series.

## Anatomy
Root flex, gap 12 (--space-12) > item (flex, gap 5/6, items center) > marker + label. Marker is a StatusDot (6px, status legends: ran / running / not reached) or a series swatch (chart legends; drawn on DS-Patterns > Charts "legend · two series · hover crosshair").

## Variants
- `kind: 'hue'` (added for the TimelineWaterfall): a series-style swatch in the `--hue-<kind>-fg` colour of a NodeKind, so a legend can match step bars and tiles; hidden items fall back to the muted swatch like series.
- `kind: 'status'`: StatusDot marker, items `{ kind: StatusKind; label }`.
- `kind: 'series'` (drawn on DS-Patterns): a line swatch 12x3, radius 2, in the series colour (`--chart-1..4`), items `{ color: ChartColor; label }`; item inline-flex gap `--space-6`, label `--type-caption` 12 `--color-ink-secondary`; items gap `--space-16`. Sits above the plot, left-aligned, under the ChartCard header. (Replaces the 8px-square proposal.)
- Interactive series toggle (drawn on DS-Patterns): clicking an item hides that series; the hidden item shows a `--chart-muted` swatch and a `--color-mute` label struck through (`text-decoration: line-through`) (replaces the 45%-opacity proposal). Items are buttons with `aria-pressed` (pressed = visible).

## Sizes
Status legend: label --type-small (11.5px) --color-mute, dot --size-dot-sm (6px). Series legend: label 12 `--color-ink-secondary`, swatch 12x3 radius 2 (component-local).

## States
Status legend: static. Series legend: toggle as above; focus-visible = outside ring, 2px gap (`--shadow-focus-ring`). Hover over a legend item highlights its series: UNDESIGNED (proposal only). At least one series must stay visible (proposal).

## Props
```ts
type LegendItem = { id: string; label: string; marker: { kind: 'status'; status: StatusKind } | { kind: 'series'; color: ChartColor } | { kind: 'hue'; hue: NodeKind } };
type LegendProps = { items: LegendItem[]; hiddenIds: string[] | null; onToggle: ((id: string) => void) | null };
enum ChartColor { Chart1 = 'chart-1', Chart2 = 'chart-2', Chart3 = 'chart-3', Chart4 = 'chart-4', Muted = 'chart-muted' }
```

## Accessibility
List semantics (ul/li); markers aria-hidden; label text is the only carrier. No Radix.

## Light/dark
Token-driven. DS-Dark-Display draws the status dots only (ok #4CB884, warn #D9963A, err #F08A7C, 8px); no series legend is drawn on the Data or Display pages. DS-Dark-Patterns draws the series legend: swatches #4DB6AE (chart-1) and #8DB4E8 (chart-2), hidden swatch #4A463F (chart-muted), labels #CFCAC1, hidden label #A29C92.

## Used by
Flow run view (status legend, DS-Display); ChartCard (series legend, two-series chart).
