# ResultCard
Purpose: knowledge-search hit: source label, score badge and snippet.

## Anatomy
root (flex column, gap 6, padding 10px 12px, border `--color-line`, radius `--radius-10`, bg `--color-card`; demo width 300) > header (space-between: label 11.5px `--color-mute`, "Services . Notion"; Badge accent mono, score) + snippet (12.5px `--color-ink-secondary`, `--leading-relaxed`).

## States
Static. UNDESIGNED: clickable hit and highlighted match. Proposal: whole card as a link with the LinkCard hover and focus rules; match in `--color-accent-light` mark.

## Props
```ts
type ResultCardProps = { source: string; score: number | null; snippet: string }
```

## Accessibility
`article` or `li`; score is visible text. No Radix.

## Light/dark
Token-driven.

## Used by
Knowledge search results.
