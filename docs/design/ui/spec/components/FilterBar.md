# FilterBar
Purpose: row with a search input and filter chips (applied and unapplied), with a right-aligned chip (`filter_bar(items, right)`).

## Anatomy
Search (250px, icon left, 34px) | FilterChip... | spacer | right chip (e.g. time range).

## FilterChip variants
- `applied`: border 1px --color-accent, bg --color-accent-light, text --color-accent-dark, content "Agent: **Booking assistant**" (value weight 600). Designer: TWO targets. The label area is a button that reopens the picker; the trailing `x` is a separate 28px-high icon button (aria-label "Clear filter: Agent") that clears the filter. (The page markup still draws one button with an `x`; implement the split.)
- `empty`: dashed border 1px --color-line-dash, transparent bg, text --color-ink-secondary, label + chevron (e.g. Version, Channel, Last 24 h).

## Sizes
Chip height 28px (--size-control-sm; small controls are 28 everywhere), padding 0 10px, radius --radius-pill, 12px (--type-caption), gap --space-4/5. Search height --size-control-md, radius --radius-8, padding 0 10px 0 30px, font 12.5px. Bar gap --space-8 (DS-Data); the DS-Patterns sample "filter bar with 2+ applied" uses gap `--space-6`: OPEN, proposal 8.

## States
focus-visible: outside ring with 2px gap (`--shadow-focus-ring`) per target (label and x focus separately). Search field focus: 1px accent border + 3px soft halo (`--shadow-focus-field`). disabled: 45% opacity, no hover/focus, not-allowed. hover/open: UNDESIGNED; proposal: open chip uses the applied style; chip opens a Radix Popover/DropdownMenu listing options. Picker content and "Clear all": drawn on DS-Patterns > Filter chip. Picker: see FilterChip > Picker (multi-select, applies as you tick, Esc or outside click closes, search over 8 options); `FilterPicker` (Popover + Checkbox rows + SearchInput) is built here, in FilterBar's folder or a sibling `FilterPicker/`. "Clear all": text button after the chips (height 22, 12.5/600, `--color-accent`), shown only when two or more filters are applied. Single-value filters (period) use a SegmentedControl, not a chip, so the trailing "Last 24 h" chip becomes a SegmentedControl (OPEN against DS-Data, which still draws the chip).

## Props
```ts
type FilterChipProps = { label: string; value: string | null; onClick: () => void; onClear: (() => void) | null };
type FilterBarProps = { query: string; onQueryChange: (q: string) => void; searchPlaceholder: string; filters: FilterChipProps[]; trailing: ReactNode | null; onClearAll: () => void; clearAllLabel: string };
```

## Tokens
as above; search border --color-line, bg --color-card, text --color-ink.

## Accessibility
Search input needs label (visually hidden label + aria-label present). Chips are buttons with `aria-haspopup="listbox"`/`aria-expanded`; applied chip: label button announces "Agent: Booking assistant", x button has its own label. Radix Popover or DropdownMenu/Select fits (inside shared/ui). Existing Input can be reused for search (verify height 34 and left icon slot).

## Light/dark
Token-driven (dashed line, accent-light and accent-dark have dark values).

## Used by
DS-Data (Filter bar). Runs/Traces, conversations lists (implied).
