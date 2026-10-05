# LineChart
Purpose: line chart, single series with an end-point marker (`line_chart`, DS-Data) or up to 4 series with a series Legend and hover crosshair (DS-Patterns).

## Anatomy (SVG 322x150)
Y labels (right-aligned x=24) + 3 gridlines (--color-line-row, 1px, no explicit width); polyline stroke 2px, round joins/caps, fill none; X labels (y=145, centred); end-point dot r=4.5 with 2px white (--color-card) stroke at last value. Points evenly spaced (~43.7px), left pad 30, right pad ~22.

## Variants
- single series (accent): last point emphasised with the end marker (page).
- two series (drawn on DS-Patterns > Charts, SVG 520x200 in a ChartCard): `--chart-1` (accent) and `--chart-2` (#2B5E9E / dark #8DB4E8) polylines, stroke 2, fill none; Legend (series) above the plot; a third legend item can be hidden (struck through, `--chart-muted`). No end markers at rest on this board (markers appear only at the hovered x). Gridlines: 4 (0/100/200/300) from x=36 to 520, `--color-line-row`; y labels x=30 end-anchored, 11 `--color-mute`; x labels y=194, 11, centred; points step about 77.3.
- area fill, dashed comparison: UNDESIGNED. 3 and 4 series: palette has `--chart-3` and `--chart-4` (drawn as tokens only); more than 4: proposal group the rest as "Other" in `--chart-muted`.

## States
- default: last point emphasised.
- hover (drawn on DS-Patterns): vertical crosshair at the nearest x from the top gridline to the baseline, 1px `--color-edge` dashed `3 3`; a marker on each visible series at that x (r 4.5, fill series colour, stroke `--color-card` 2); multi-series ChartTooltip to the right of the crosshair (12px gap), flipping left near the right edge; title = full date ("Mon, Sep 28"), one row per series.
- keyboard focus: UNDESIGNED. Proposal: chart is one tab stop; Left/Right move the active x; `--shadow-focus-ring` around the plot.
- empty/loading: DS-Patterns points to DS · States › Charts (see BarChart for the drawn chart loading and empty boxes).

## Props (library-neutral)
```ts
type LinePoint = { x: string; y: number | null };
type LineSeries = { id: string; label: string; points: LinePoint[]; color: ChartColor };
type LineChartProps = {
  series: LineSeries[]; yDomain: [number, number]; yTicks: number[]; formatY: (v: number) => string;
  formatTooltip: (p: { series: LineSeries; point: LinePoint }[]) => ReactNode;
  showEndMarker: boolean; legend: 'none' | 'top'; hiddenSeriesIds: string[]; onToggleSeries: ((id: string) => void) | null; height: number; ariaLabel: string;
};
```
`y: null` = gap in line (null not undefined).

## Tokens
Stroke = series colour (`--chart-1..4`; single series `--chart-1` = --color-accent), width 2 (local chart constant); gridline --color-line-row; axis text --color-mute --type-hint; marker fill = series colour, ring --color-card width 2; crosshair 1px --color-edge dashed 3 3; font inherit.

## Series colours / legend
Chart palette drawn on DS-Patterns > Charts: `--chart-1` #0F6B6B / #4DB6AE (accent), `--chart-2` #2B5E9E / #8DB4E8, `--chart-3` #8E5410 / #E0A86A, `--chart-4` #5E43A8 / #B9A6F0, `--chart-muted` #CFC9BF / #4A463F (hidden series, "Other"); see tokens.md and Legend. Series must also differ by something other than colour in the tooltip/legend text.

## Accessibility
`role="img"` + aria-label with summary (trend and last value), hidden table fallback; tooltip keyboard reachable.

## Light/dark
Drawn on DS-Dark-Data (single accent series only): gridlines #2A2824, axis #A29C92, line and end marker #4DB6AE, marker ring `--color-card` #211F1C, "custom" badge violet #2A2340/#B9A6F0. Two-series hover is drawn on DS-Dark-Patterns: lines #4DB6AE and #8DB4E8, crosshair `--color-edge` #7A746A, marker stroke #211F1C, gridlines #2A2824, tooltip #ECE8E1 / #1A1816.

## Used by
DS-Data (Average quality score, with "custom" pill header); DS-Patterns (Conversations per day by channel: Telegram, API, Web widget).
