# ListHead
Purpose: list header showing a count and a sort toggle (`list_head`, with `sort_btn`).

## Anatomy
Row: count text left ("1,037 runs"), SortButton right (label + chevron icon). Bottom border.

## Variants
SortButton label: `Newest first` | `Oldest first` (toggle); icon `chevron-down` on the page (renamed from chev), flips with direction.

## Sizes
Padding 10px 16px; text --type-caption (12px) color --color-mute; gap --space-4; button borderless, transparent, no padding.

## States
SortButton: focus-visible = outside 2px-gap ring (`--shadow-focus-ring`); disabled = 45%, not-allowed. Hover/pressed UNDESIGNED for the list SortButton (proposal: color --color-ink). Table header sorting is drawn on DS-Patterns > Table: faint `sort` 11 on hover of a sortable header, click cycles descending → ascending → off, one column at a time, active header `--color-ink` + `arrow-down`/`arrow-up` 11 stroke 1.8 (see Table). New icons: `sort`, `arrow-up`, `arrow-down` (use `arrow-up`/`arrow-down` for the active direction in table headers, `sort` for an unsorted sortable column; the page list head still shows `chevron-down`). Same SortButton usable inside Table header cells.

## Props
```ts
type ListHeadProps = { countLabel: string; sort: { label: string; direction: 'asc'|'desc' }; onToggleSort: () => void };
type SortButtonProps = { label: string; direction: 'asc'|'desc'|null; onClick: () => void };
```

## Tokens
border-bottom --color-line; text --color-mute.

## Accessibility
SortButton is `<button>`; in table headers add `aria-sort`. For menu-based sort use Radix DropdownMenu/Select.

## Light/dark
Token-driven.

## Used by
DS-Data (Record rows, with RunRow). Runs/Traces lists.
