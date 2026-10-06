# FilterChip
Purpose: pill that opens a filter picker; dashed when empty, accent with a clear mark when applied.
Source: DS-Actions v2 (Filter chip); behaviour from the designer answer. States: drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
pill (inline-flex, gap `--space-5`) with two parts when applied: label target (text "Agent: **Booking assistant**") and clear target (`x` icon, 10px, stroke 1.8). Empty and value-not-applied chips are one button with a trailing `chevron-down` (11px).

## Variants
- empty: 1px dashed `--color-line-dash`, transparent, text `--color-ink-secondary`, label + `chevron-down` ("Channel").
- value, not applied: same look with the value as label ("Last 24 h" + `chevron-down`).
- applied: 1px solid `--color-accent`, bg `--color-accent-light`, text `--color-accent-dark`, value weight 600, trailing `x`.
- applied, several values (drawn on DS-Patterns): first value + "+N" in the bold part ("Channel: **Telegram +1**").
Single-value filters such as the period use a SegmentedControl instead of a chip (drawn rule, DS-Patterns > Filter chip); the "value, not applied" chip is kept only for single-value filters that are not a short fixed set (OPEN: the DS-Data filter bar still draws "Last 24 h" as a chip).
Height 28 (`--size-control-sm`), padding-x `--space-10`, radius `--radius-pill`, font 12 (`--type-caption`).

## Behaviour (designed)
Applied chip has two targets: clicking the label reopens the picker; clicking the `x` clears the filter. Each target is a separate button with its own focus ring and name.

## States (drawn on DS-States / DS-Dark-States)
- hover (empty / not applied): bg `--color-soft`, border colour `--color-edge` (stays 1px dashed).
- open (picker showing, not applied): bg `--color-soft`, border 1px solid `--color-edge`.
- applied hover: bg stays `--color-accent-light`, border `--color-accent-dark`.
- clear target hover: the `x` sits in a 16px circle, bg `--color-accent-dark`, icon `--color-accent-light`; hit area 24 (page: "the ✕ (16px hit area 24) clears it").
- focus-visible: outside ring `--shadow-focus-ring`, pill radius, on whichever target is focused.
- disabled: global rule (0.45, not-allowed, no hover/focus).
Applied open state: not drawn separately; keep the applied look (UNDESIGNED, proposal unchanged). DS-Patterns > Filter chip draws the same open look (soft bg, solid `--color-edge` border) above its picker.

## Picker (drawn on DS-Patterns > Filter chip)
Ownership: FilterChip stays a trigger (layer 1, lane 2). The picker needs Popover (layer 1, lane 3) plus Checkbox, so `FilterPicker` is built with FilterBar (layer 3, lane 2), not inside FilterChip.
Opens below the chip, gap `--space-6`. Surface: listbox width 220, bg `--color-card`, border `--color-line`, radius `--radius-10`, `--shadow-popover`, padding `--space-6`, gap `--space-2` (Menu tokens). Option row: padding `--space-7` `--space-8`, radius `--radius-6`, space-between, gap `--space-10`: Checkbox 16 + label 12.5 `--color-ink` (gap `--space-8`) left, count `--type-hint` 11 `--color-mute` right ("1,470"). Multi-select applies as you tick (no Apply button); closes on Esc or outside click; lists over 8 options get a SearchInput at the top (`FILTER_SEARCH_THRESHOLD = 8`, look not drawn: proposal SearchInput sm inside the padding).

## Props
```ts
type FilterChipProps = { label: string; value: string | null; extraCount: number; applied: boolean; open: boolean; onOpen: () => void; onClear: () => void; clearLabel: string }
type FilterPickerProps = { options: { id: string; label: string; count: string | null }[]; selectedIds: string[]; onSelectedIdsChange: (ids: string[]) => void; searchLabel: string; ariaLabel: string }
```

## Accessibility
Label target: button with `aria-haspopup="dialog"` or `listbox`, `aria-expanded`. Clear target: button with `aria-label` ("Clear Agent filter"). Radix Popover for the picker (inside `shared/ui`).

## Light/dark
Token-driven; accent-light and accent-dark have dark values.

## Used by
FilterBar (Traces, Inbox).
