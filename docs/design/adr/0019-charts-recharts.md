# 0019. Recharts for the chart components

- **Status:** Accepted
- **Date:** 2026-10-05

## Context
- The design system draws two chart components, `BarChart` and `LineChart`, framed by `ChartCard` and sharing a `ChartTooltip` and the series `Legend`. The spec leaves the library open: "chart library or hand-rolled SVG (crosshair, multi-row tooltip, legend toggle), an ADR".
- Requirements from the spec:
  - vertical bars with a 4px top radius; the highlighted bar stays at full strength while the others drop to 0.82;
  - lines of up to four series in the `--chart-1..4` palette, a gap where a value is missing, an end marker on the last point;
  - on hover a dashed crosshair, a marker on every visible series and a multi-row tooltip that flips at the edges;
  - one tab stop per chart; Left and Right move the highlight (proposal, not drawn);
  - every colour, font and line comes from our design tokens and follows the light and dark switch;
  - loading and empty boxes drawn on DS-States.
- The user chose Recharts on 2026-10-04.
- **Recharts 3:**
  - React components over D3 scales; axes, grid, bars and lines are declarative;
  - renders plain SVG with stable class names, so CSS modules can style it with our CSS variables;
  - custom shapes and children get the chart scales through hooks (`useXAxisScale`, `useYAxisScale`, `usePlotArea`), which is enough to draw our own crosshair, markers and tooltip;
  - renders in jsdom when it gets an explicit width, so components can be tested;
- **Hand-rolled SVG:** no dependency, but scales, nice ticks, the band layout and every edge case are ours to write and test.
- **visx, Nivo, ECharts:** visx is lower level than we need; Nivo and ECharts bring their own theming and tooltips that fight the drawn ones.

## Decision
1. **`BarChart` and `LineChart` use Recharts 3** for scales, axes, grid, bars and lines.
2. Recharts is used **only inside `shared/ui`**, like Radix. Features use `BarChart`, `LineChart`, `ChartCard`, `ChartTooltip` and `Legend`, never Recharts.
3. **Styling is CSS, not props.** Bars, lines, gridlines, ticks and markers get their colour from our tokens in `.module.scss`; the series colour is the `ChartColor` enum from `Legend`.
4. **Interaction is ours, not the Recharts tooltip.** The chart keeps the highlighted index (`useChartHighlight`), takes it from the pointer and the arrow keys, and draws the `ChartTooltip` as an HTML layer above the SVG. The Recharts accessibility layer and animations are off.
5. **Accessibility:** the chart is a `listbox` with one visually hidden `option` per category ("Tue, Sep 29: 301 chats"); `aria-activedescendant` follows the highlight, so a screen reader reads the value the tooltip shows. The SVG and the visual tooltip are `aria-hidden`.
6. **Loading and empty** do not render a chart. They render the drawn placeholder boxes from DS-States at the chart's height.
7. **Out of scope for now** (undesigned in the spec): stacked and grouped bars, area fill, dashed comparison lines, an "Other" series for more than four, and legend hover highlighting.

## Consequences
- One more dependency in `apps/web`: `recharts`, which brings `@reduxjs/toolkit`, `immer` and parts of D3.
- The chart width is measured with a `ResizeObserver` and falls back to the drawn 520px until it is known, so tests in jsdom render a real chart.
- Pointer position maps to an index with the same plot geometry the chart uses (band for bars, point for lines), so the highlight does not depend on Recharts internals.
- A later chart type (area, stacked bars) can reuse the same highlight hook, tooltip and placeholder.

## Alternatives considered
- **Hand-rolled SVG:** smallest bundle, but more code to own for scales and ticks than the chart screens justify.
- **The Recharts `Tooltip` component:** positions itself and supports keyboard focus, but its placement rules differ from the drawn ones (above the bar, right of the crosshair) and it is hard to style from tokens.
- **visx:** fine-grained D3 primitives with no chart layout; close to hand-rolling.
