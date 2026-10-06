# ChartCard
Purpose: card frame for a chart: title, header meta/action, chart body, tooltip anchor.

## Anatomy
Card (radius 12, padding 16, gap 10 (bar) / 8 (line), position relative): header [h3 title left | meta right: date-range text or pill] + chart + absolutely positioned tooltip layer.

## Variants
Header meta: text (`Sep 24 – 30`, --type-caption --color-mute) | Badge (violet "custom"). Legend position drawn on DS-Patterns > Charts: below the header, above the plot, left-aligned. Card gap is `--space-12` there (padding `--space-16`, radius 12), vs 10 / 8 on DS-Data: OPEN, proposal 12 when a legend is present.

## Tokens
bg --color-card, border --color-line, radius --radius-12, padding --space-16, title --type-title color --color-ink.

## Props
```ts
type ChartCardProps = { title: string; meta: ReactNode | null; legend: ReactNode | null; children: ReactNode };
```

## Accessibility
Heading + `role="img"` chart with `aria-label` and a data summary (or hidden table fallback). Empty and loading states: DS-Patterns points to DS · States › Charts (drawn there; see BarChart): header unchanged, plot area replaced.

## Used by
DS-Data (Charts). Same Card concept as existing shared/ui Card (reuse; header variant is shared with Table toolbar).
