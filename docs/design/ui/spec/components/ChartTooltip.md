# ChartTooltip
Purpose: small tooltip (dark bubble in light theme, light bubble in dark theme) for a highlighted chart datum (`popover(tooltip)`).
Source (states): drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
Inline-block bubble: `<strong>Label</strong> · value text`. Absolutely positioned above bar (left 382px, top 52px in demo, z-index 2).

## Sizes / tokens
same surface as `Tooltip`: padding --space-5 --space-9, bg --color-tooltip-bg, text --color-tooltip-fg, radius --radius-8, --type-caption, nowrap, shadow --shadow-tooltip, z-index `--z-popover` (tokens.md z table: chart tooltips sit at 200, inside the chart layer; the generic Tooltip uses `--z-tooltip` 600).

## States (drawn on DS-States / DS-Dark-States)
visible while a datum is hovered or focused; hidden otherwise. No arrow/caret (the generic Tooltip has one; the chart tooltip does not). Placement: above the hovered bar, flips below near the top edge of the plot (drawn rule). Content: `<strong>Tue, Sep 29</strong> · 301 chats` (title is the full date). Horizontal edge flipping (drawn rule, DS-Patterns > Charts, line charts): the tooltip follows the hovered x, to the right of the crosshair, flipping to the left near the right edge.

## Multi-series layout (drawn on DS-Patterns > Charts)
column (flex, gap `--space-4`), padding `--space-8` `--space-10`, `--type-caption` 12, nowrap, same bg / fg / radius 8 / `--shadow-tooltip` > title `<strong>` ("Mon, Sep 28") + one row per visible series (flex, align centre, gap `--space-6`): 8px dot (`--size-dot-md`, round) in the series colour + label + value (margin-left `--space-12`, tabular-nums). Positioned 12px right of the crosshair, near the top of the plot. The single-row layout above (padding 5/9) stays for bar charts.

## Props
```ts
type ChartTooltipProps = { title: string; rows: { label: string | null; value: string; color: ChartColor | null }[]; anchor: { x: number; y: number }; placement: 'above' | 'right'; visible: boolean };
```

## Accessibility
`role="tooltip"`, referenced by `aria-describedby` on the focused datum; appears on focus as well as hover; Escape dismisses. Radix Tooltip fits for generic tooltips, but SVG anchor positioning in charts typically needs custom positioning (Radix Popover/Tooltip with virtual anchor possible).

## Light/dark
Designer: the tooltip inverts to a light bubble in dark theme. Both tokens have dark values in tokens.md (--color-tooltip-bg / --color-tooltip-fg), shadow --shadow-tooltip is a per-theme token. Two-series hover: drawn (see Multi-series layout); DS-Dark-Patterns: bubble #ECE8E1, text #1A1816, dots #4DB6AE / #8DB4E8, shadow 0 4px 12px rgba(0,0,0,.5).

## Used by
DS-Data (Charts). Reusable for any tooltip: likely shared with Display page (Tooltip) -- noted as first seen here only if Display spec absent.
