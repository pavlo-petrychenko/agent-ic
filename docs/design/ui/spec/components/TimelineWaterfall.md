# TimelineWaterfall
Purpose: waterfall view of a run: time axis with ticks and one bar row per step (`timeline_axis`, `timeline_row`).

## Anatomy
- TimelineAxis: grid (label col 150px | track 210px, gap 8px), tick labels absolutely positioned (0s, 1s, 2s).
- TimelineRow: same grid, height 32px, step name left (ellipsis), track relative 16px high with bar (abs, top 3px, height 10px, radius 3px, solid step hue) and duration label positioned after the bar (or before it if bar nears the end).
- SectionLabel (`section_label`): small caption heading ("Linked run · Tool event ...").

## Variants
Bar colours by step kind (compl --hue-compl-fg guard, agent --hue-agent-fg model, tool --hue-tool-fg). Nested step: extra left padding (24px vs 12px).

## Sizes
Row padding 0 16px 0 12px; axis padding 8px 16px 4px 12px; tick text --type-mono-xs weight 400. Scale: 72px per second in the design (props needed).

## States
selected row: bg --color-accent-light (page shows no inset bar on the waterfall; keep it bar-less). focus-visible: inset 2px accent ring (`--shadow-focus-ring-inset`). disabled: 45%, no hover/focus. hover (decided): row bg `--color-soft`. Bar hover tooltip (decided): ChartTooltip with the step name and duration.

## Props (library-neutral)
```ts
type TimelineRowData = { id: string; label: string; depth: number; startMs: number; durationMs: number; kind: TraceStepKind };
type TimelineProps = { rows: TimelineRowData[]; totalMs: number; ticks: number[]; selectedId: string | null; onSelect: (id: string) => void; labelWidth: number };
```
Bars: left = startMs/totalMs * trackWidth, width = max(durationMs/totalMs * trackWidth, min 2px); label flips side when no room. Built as hand-rolled SVG (no chart library): the track width is measured (fallback 210) so the scale follows the container, `labelWidth` defaults to 150, ticks are positioned in percent. Each row is a list item with an overlay button named by `description` ("<name>, starts at X, lasts Y"), `aria-current` when selected; the drawing is `aria-hidden`. The ChartTooltip (step name and duration) shows on pointer hover and on keyboard focus of the row. The Legend lists the step kinds that appear in `rows`, using the Legend `hue` marker (the `--hue-<kind>-fg` colour of each bar). `caption` is the SectionLabel.

## Tokens
axis/tick text --color-mute; section label --type-small --color-mute padding 8px 16px 4px; bar radius 3px (local chart constant).

## Accessibility
A list with `aria-label` ("Run timeline"); bars decorative with the text alternative "<name>, starts at X, lasts Y" on the row button. Colour not sole carrier: label has the duration.

## Light/dark
Bars use the step hue fg tokens, whose dark values are in tokens.md. Bar fills are solid hue fg; the duration label carries the value so colour is not the only carrier.

## Used by
DS-Data (Trace rows); Traces-Timeline page.
