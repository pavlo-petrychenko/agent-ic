# SelectionBar
Purpose: shows how many items are selected with the bulk actions for them. Two forms are drawn on DS-Patterns: the inline bar that replaces a table toolbar, and the floating toolbar over a canvas multi-selection. New.

## Anatomy
- inline (DS-Patterns > Table): bar (flex, space-between, align centre, padding `--space-10` `--space-14`, min-height 32, border-bottom `--color-line`) > left group (flex, gap `--space-10`): count ("2 selected", `--type-title` 13/600 `--color-ink`) + action Buttons sm 28 (secondary with leading icon 13, e.g. `pause` "Pause"; danger outlined, e.g. "Delete", no icon) | right: clear IconButton ghost sm 28 (`x` 14, `--color-mute`, aria-label "Clear selection").
- floating (DS-Patterns > Canvas interactions > marquee): toolbar (flex, gap `--space-4`, padding `--space-4`, bg `--color-card`, border `--color-line`, radius `--radius-8`, `--shadow-popover`) > count ("2 selected", 12/600, padding 0 `--space-6`) + IconButtons ghost sm 28 (`copy` "Duplicate", `x` "Delete"; icon 14 `--color-mute`). Positioned just below the selection bounds (sample: 4px under the marquee, right half).

## Variants
`variant: 'inline' | 'floating'`.

## States
Appears when 1+ items are selected; inline replaces the toolbar while a selection exists. ✕ or Esc clears (drawn rule). Buttons carry their own states (DS-States). The canvas has no clear button; Esc or a click on empty canvas clears.

## Props
```ts
enum SelectionBarVariant { Inline = 'inline', Floating = 'floating' }
type SelectionBarProps = { variant: SelectionBarVariant; countLabel: string; actions: ReactNode; onClear: (() => void) | null; clearLabel: string | null }
```

## Tokens
inline: `--color-line`, `--space-10`, `--space-14`, `--type-title`; floating: `--color-card`, `--color-line`, `--radius-8`, `--shadow-popover`, `--space-4`, `--space-6`; z for floating: `--z-raised` (canvas toolbars).

## Accessibility
`role="toolbar"` with `aria-label` ("Bulk actions"); the count is a live region (`aria-live="polite"`); Esc clears the selection and returns focus to the last focused row or node.

## Light/dark
DS-Dark-Patterns: card #211F1C, border #34312C, dark popover shadow (floating); danger button border #6B302A and text #F08A7C.

## Used by
Table with bulk actions (agents list), FlowCanvas multi-selection.

## Differs from current web
New.
