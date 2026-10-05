# Table
Purpose: card-wrapped data table with optional toolbar, selectable rows, expandable detail row and footer.
Source: DS-Data (revised) "Tables" `table(cols, head, rows, selected, pad, head_align, toolbar, detail, footer, head_bg)`. Not in existing shared/ui (only Card exists). Row states (hover, checked, focus, disabled) drawn on DS-States / DS-Dark-States; full table patterns (sorting, selection bar, pagination, loading, empty) are on DS-Patterns.

## Anatomy
- Root: card surface, overflow hidden.
- Toolbar (optional): title `h3` left, actions right, bottom border.
- Header row: CSS grid, same column template as body rows.
- Body rows: grid, `align-items:center`, cells (see TableCell, TableCellLead).
- Detail row (optional): full-width panel under a row, indented, shares selected bg.
- Footer (optional): "Showing 3 of 18" left, link action right, top border, panel bg.

## Variants
- `headTone`: `default` (transparent) | `panel` (--color-panel bg, used with cell-lead tables).
- `padding`: `compact` (row 10px 16px, header 9px 16px; page caption "header padding follows row padding" but header stays 9px 16px in both samples) | `comfortable` (row 12px 16px, header 9px 16px).
- Columns: grid template per table, e.g. `minmax(0,1.5fr) minmax(0,1fr) 64px 64px`, gap 10px. Numeric columns right-aligned (header and cell).

## Sizes
Single size; density via `padding`. Row min height implied by padding (~37px compact, ~58px with lead).

## States
- default; selected (bg --color-accent-light + inset 2px bar `box-shadow: inset var(--border-width-strong) 0 0 var(--color-accent)`, drawn on the row and on its detail row). Designed: toolbar, selected row, expanded detail ("Judge: ..."), footer ("Showing 3 of 18" + "Show all" link), head tone default/panel.
- focus-visible (designer rule, drawn on DS-States): 2px accent ring inside the row (`--shadow-focus-ring-inset`; the card clips an outside ring).
- disabled (one rule): colours unchanged at --opacity-disabled (45%), no hover or focus, cursor not-allowed.
- hover (drawn on DS-States): row bg --color-soft; the row-menu IconButton (ghost sm 28, `more` 14) gets bg --color-soft and icon --color-ink.
- checked (multi-select, drawn on DS-States): row bg --color-accent-light with the leading Checkbox checked; no inset bar on this sample. The 2px bar stays for the current/open row above (DS-Data); a row that is both gets both.
- Row menu button: drawn visible in every row state (rest colour --color-mute); page note: "always visible on hover and focus".
- DS-States sample grid: `32px minmax(0,1fr) 96px 28px`, gap 10, padding 10 14 (checkbox column 32, status Badge column 96, menu column 28).
- loading (drawn on DS-Patterns > Table): header row kept; 3 Skeleton rows, row padding `--space-14`, same grid (see Skeleton "table rows").
- empty (drawn on DS-Patterns): after filtering = EmptyState `filtered` in the card body under the kept header (padding 40 24, neutral tile `filter`, secondary Button sm "Clear filters"); empty with no data = the page's first-run EmptyState.
- error (drawn on DS-Patterns): header kept; body padding `--space-16` holding a Callout err ("Couldn’t load agents — the connection dropped.", icon `alert` 14) with a secondary Button sm "Retry" (leading `refresh` 13) at its end.
- Sorting (drawn on DS-Patterns): sortable headers show a faint `sort` icon (11, stroke 1.5) on hover (the board draws it at rest on every sortable header to show the affordance); click cycles descending → ascending → off; one sort column at a time; the active header turns `--color-ink` with an `arrow-down` / `arrow-up` 11 (stroke 1.8). The rule text says "accent arrow" but the markup draws the arrow in the header's ink colour: OPEN, proposal ink as drawn. Header label gap `--space-4`; numeric headers end-aligned.
- Selection (drawn on DS-Patterns): checkbox column only on tables with bulk actions; header box cycles off · mixed (indeterminate) · all (current page). Selecting replaces the toolbar with the SelectionBar (inline: "2 selected" + secondary sm actions + outlined danger + ✕ clear); ✕ or Esc clears. Checked rows: bg `--color-accent-light`, no inset bar (matches DS-States).
- Row click (drawn rule): the whole row opens the item; the checkbox, ••• and inline links stop propagation. Keyboard: ↑↓ move focus, Enter opens, Space toggles the checkbox.
- Row menu (drawn on DS-Patterns): ••• IconButton ghost sm 28 (`more` 14) in a 36px trailing column; visible on row hover and focus (always visible on touch); hover bg `--color-soft` + ink; open bg `--color-chip` + ink. The Menu (action rows, width 180) opens below-right and flips up near the bottom. Rows: Open (`chevron-right`), Pause (`pause`), Delete (`x`, label `--color-err`).
- Expansion (drawn on DS-Patterns): a chevron (11, stroke 1.8, `chevron-right` collapsed / `chevron-down` expanded) before the first cell, gap `--space-8`; expanded content is a `--color-panel` strip under the row (padding 12px 14px 14px 76px, i.e. indented to the text column; border-bottom `--color-line-row`), here a 3-column grid (gap `--space-12`) of KeyValue pairs: label 11 `--color-mute`, value `--type-mono` 12 `--color-ink`, gap `--space-2`. The expanded row itself keeps the default bg (no selected bar).
- Pagination (drawn on DS-Patterns): 25 rows per page by default (50, 100); the footer shows the range and total (Pagination). Live-updating lists (runs, inbox) use "Load more" at the end instead of pages (button look not drawn: proposal secondary Button sm centred in the footer).
- Narrow widths (drawn rule, DS-Patterns > Responsive): tables keep their first column and hide low-priority columns (marked per column in each screen spec) before scrolling horizontally. Add `priority: 'high' | 'low'` per column; below 1280 low columns hide first, then the card body scrolls with the first column sticky (proposal for the sticky part).
- DS-Patterns sample grid: `36px minmax(0,2fr) 120px 80px 80px 36px`, gap 10, header padding 8px 14px, row padding 10px 14px (DS-Data uses 16px sides: OPEN, proposal 14 for checkbox tables, 16 otherwise).

## Props proposal
```ts
type TableColumn<T> = { id: string; header: string; width: string; align: 'start'|'end'; render: (row: T) => ReactNode; sortable: boolean; priority: 'high'|'low' };
type TableProps<T> = {
  columns: TableColumn<T>[]; rows: T[]; getRowId: (row: T) => string;
  selectedRowId: string | null; onRowSelect: ((id: string) => void) | null;
  padding: 'compact'|'comfortable'; headTone: 'default'|'panel';
  toolbar: ReactNode | null; footer: ReactNode | null;
  renderDetail: ((row: T) => ReactNode) | null;
  sort: { columnId: string; direction: 'asc'|'desc' } | null; onSortChange: ((s) => void) | null;
  selectedIds: string[] | null; onSelectedIdsChange: ((ids: string[]) => void) | null; bulkActions: ReactNode | null;
  rowActions: ((row: T) => MenuItem[]) | null; onRowOpen: ((row: T) => void) | null;
  expandedIds: string[] | null; onExpandedIdsChange: ((ids: string[]) => void) | null;
  status: 'ready'|'loading'|'error'; error: { message: string; onRetry: () => void } | null; empty: ReactNode | null;
  pagination: PaginationProps | null;
};
```

## Tokens
- Surface: --color-card, border --border-width solid --color-line, radius --radius-12.
- Toolbar: padding --space-12 --space-16, title --type-title color --color-ink, gap --space-8/--space-10, border-bottom --color-line; toolbar actions are Button sm = 28px (`--size-control-sm`, was 30).
- Header: padding --space-9 --space-16, --type-small, color --color-mute, border-bottom --color-line; panel tone bg --color-panel. DS-Patterns draws the header 11.5/600 (weight 600, not 400) on `--color-panel` with padding 8px 14px: OPEN, proposal 600 everywhere (matches the active-sort emphasis).
- Row: gap --space-10, padding --space-10 --space-16 (or --space-12), separator border-bottom --border-width solid --color-line-row; last row none.
- Selected: bg --color-accent-light, bar --color-accent width --border-width-strong (2px).
- Detail: padding 0 --space-16 --space-12 --space-32, --type-caption color --color-ink-secondary, border-bottom --color-line-row.
- Footer: padding --space-10 --space-16, bg --color-panel, border-top --color-line, --type-caption color --color-mute; action link --type-caption weight 600 color --color-accent, standalone link: no underline at rest, underline on hover. Pagination footer (DS-Patterns): padding 8px 14px, no panel bg (card bg), border-top --color-line; see Pagination.
- Accent is teal only (blue/violet were design-tool options): use --color-accent, never a hardcoded value.

## Accessibility
Use `<table>`/`role="table"` semantics (or `role="grid"` if selectable): `th scope="col"`, `aria-sort` on sorted header, selected row `aria-selected="true"`/`aria-current`. Design uses div grids; implement with real table + `display:grid` rows or ARIA roles. Interactive rows: single tab stop, Arrow Up/Down moves, Enter activates. No Radix primitive for table; Radix DropdownMenu fits row menus, Checkbox fits selection.

## Light/dark
Token-driven; every colour has a dark value in tokens.md (accent-light, line-row, panel, hue tints, status dots). Pass-state dots in cells use the brighter dot tokens (3:1) while the Badge text uses the 4.5:1 ink.

## Used by
DS-Data (Tables); DS-Patterns > Table (agents list with bulk bar, row menu, expansion, pagination, loading, empty, error). Real-screen use implied by Testing (dataset case table with judge detail: "Booking basics"), Agents list (cell-lead table), Team settings. Not verified in MVP pages.

## Differences from current code
No Table exists. Card exists: reuse Card for surface; Card must permit overflow hidden and zero padding.
