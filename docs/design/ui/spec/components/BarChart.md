# BarChart
Purpose: vertical bar chart with a highlighted bar and tooltip (`bar_chart`). `bar_x` is NOT a horizontal chart: it is a helper that returns a bar's x position. Horizontal bars are the Meter component (see Meter.md).
Source: States drawn on DS-States / DS-Dark-States (`bar_chart · line_chart`, 360x170 sample).

## Anatomy (SVG 520x200)
Y axis labels (right-aligned at x=28, 11px) + horizontal gridlines (x1=36 to full width, 1px --color-line-row); bars with 4px top radius (path with Q corners), bar width 44px, step ~69px; X category labels centred below (y=194, 11px); every bar at fill-opacity 1 at rest; while a bar is highlighted it stays at 1 and the others drop to .82 (DS-States; the DS-Data sample is that hover state); Tooltip anchored above the highlighted bar.

## Variants
- Single series, accent (--chart-1) ("Accent only; the highlighted bar carries the tooltip"): the page example.
- Multi-series / stacked: still UNDESIGNED (DS-Patterns draws multi-series only as a line chart). Proposal: grouped bars in `--chart-1..4` (palette drawn on DS-Patterns), Legend (series) above the plot, multi-series ChartTooltip (see ChartTooltip). DS-Patterns palette note: `--chart-1` is for "first series, single-series bars, meters".
- Horizontal bars: use Meter, not this component.

## States (drawn on DS-States / DS-Dark-States)
- default (nothing hovered): every bar `--color-accent` at full opacity (changed: bars are no longer .82 at rest).
- hover: the hovered bar stays at 1, all other bars drop to .82; ChartTooltip above the bar ("<strong>Tue, Sep 29</strong> · 301 chats"), flips below near the top edge.
- loading: no axes or labels; placeholder bars in `--color-soft`, width 34, radius 4 4 0 0, varied heights, `justify-content: space-around`, on a 1px `--color-line-row` baseline, same box as the chart (360x170 in the sample).
- empty: same box with a 1px dashed `--color-line-dash` border, radius `--radius-8`, centred column gap `--space-4`: title 13/600 `--color-ink` ("No conversations in this period") + hint 12 `--color-mute` ("Try a longer period or another agent").
- focus-visible: UNDESIGNED (not on DS-States). Proposal: chart is one tab stop with outside ring (`--shadow-focus-ring`); Left/Right Arrow move the highlight.
- disabled: n/a (not interactive control).
DS-States sample geometry: 7 bars of 44 on a 46.3 step (gap ratio is set by the container, not fixed), corner radius 4, gridlines and axis text as Tokens below.

## Props (library-neutral)
```ts
type BarDatum = { category: string; value: number; tooltipLabel: string | null };
type BarChartProps = {
  data: BarDatum[]; yTicks: number[] | null; yDomain: [number, number] | null;
  formatY: (v: number) => string; formatTooltip: (d: BarDatum) => ReactNode;
  highlightedIndex: number | null; onHighlight: (i: number | null) => void;
  height: number; ariaLabel: string; seriesColor: 'accent';
};
```
Width = container (responsive); gap ratio ~0.36 (bar 44 of 69 step); corner radius 4.

## Tokens
- Gridlines: stroke --color-line-row 1px (axis baseline same).
- Axis text: fill --color-mute, `--type-hint` (11px regular).
- Bars: fill `--chart-1` (= --color-accent); opacity 1 at rest and for the highlighted bar, .82 for the non-highlighted bars while one is highlighted (local chart constants; reconciled with DS-States, which replaced ".82 idle").
- Bar corner radius --radius-4.
- Font: inherit --font-sans.

## Accessibility
`role="img"` + aria-label on svg; provide hidden data table or `aria-describedby` summary; tooltip `role="tooltip"`; colour is not the only differentiator (value shown on hover/focus).

## Light/dark
Drawn on DS-Dark-Data: gridlines `--color-line-row` #2A2824, axis text `--color-mute` #A29C92, bars `--color-accent` #4DB6AE (1 at rest; .82 for the others while one is highlighted, as drawn on the hover sample), tooltip `--color-tooltip-bg` #ECE8E1 with `--color-tooltip-fg` #1A1816 and `--shadow-tooltip` 0 4px 12px rgba(0,0,0,.5); card #211F1C / #34312C. Bar top radius is 4 (path Q 4) in both themes.

## Used by
DS-Data (Charts: Conversations per day, Sep 24-30). Dashboard/analytics screens (none verified here).
