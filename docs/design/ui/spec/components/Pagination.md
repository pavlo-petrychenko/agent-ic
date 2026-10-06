# Pagination
Purpose: table footer that shows the visible range and total, a rows-per-page select and previous/next page buttons. New: drawn on DS-Patterns > Table ("sort · select · bulk bar · row menu · pagination") and DS-Dark-Patterns.

## Anatomy
footer (flex, space-between, align centre, padding `--space-8` `--space-14`, border-top `--border-width` `--color-line`, bg inherits the card) > range text ("1–25 of 412", `--type-caption` 12 `--color-mute`) | controls (flex, gap `--space-8`): "Rows" (12 `--color-mute`) + visually hidden label "Rows per page" + Select sm (width 64, height 28, radius `--radius-8`, border `--color-line`, bg `--color-card`, 12px, padding 0 `--space-8`, options 25 / 50 / 100) + previous IconButton + next IconButton.

## Variants
- paged (default): as above.
- load more (drawn rule, not drawn as a control): lists that update live (runs, inbox) end with "Load more" instead of pages. Proposal: secondary Button sm centred in the same footer, range text kept ("Showing 50 of 1,037").

## Sizes
Previous / next: IconButton secondary sm 28 (border `--color-line`, bg `--color-card`, icon `--color-ink`, `chevron-right` 14; previous is the same icon rotated 180deg), radius `--radius-8`.

## States
- previous disabled on the first page, next on the last: global rule (0.45, not-allowed, no pointer events), drawn on the first page.
- hover / focus: IconButton and Select rules (DS-States).

## Props
```ts
type PaginationProps = { page: number; pageSize: number; pageSizeOptions: number[]; total: number; onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void; rangeLabel: string; rowsLabel: string; rowsPerPageLabel: string; previousLabel: string; nextLabel: string }
```
Defaults: `pageSize` 25, `pageSizeOptions` [25, 50, 100] (`PAGE_SIZE_OPTIONS` constant). `rangeLabel` is formatted by the feature ("1–25 of 412").

## Tokens
`--color-line`, `--color-card`, `--color-mute`, `--color-ink`, `--size-control-sm`, `--radius-8`, `--space-8`, `--space-14`, `--type-caption`.

## Accessibility
`nav aria-label="Pagination"`; buttons with aria-labels "Previous page" / "Next page"; the Select has a label (visually hidden, as drawn); announce the new range politely after a page change.

## Light/dark
DS-Dark-Patterns: border #34312C, select and buttons #211F1C with #ECE8E1 text, range text #A29C92.

## Used by
Table (agents list and other paged tables).

## Differs from current web
New.
