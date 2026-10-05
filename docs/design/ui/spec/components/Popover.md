# Popover
Purpose: anchored floating panel. Named on the page ("menu · tooltip · popover") but no separate popover is drawn: it is the Menu surface with arbitrary content (account menu, filter pickers, chart tooltips' layer).

## Anatomy
Radix Popover.Content with Menu surface styling.

## States
open/closed; fade plus 4px translate, `--duration-base` `--ease-enter`; dismiss on outside click, Escape. Disabled trigger follows the global rule.

## Props
```ts
interface PopoverProps { open: boolean; onOpenChange: (open: boolean) => void; trigger: ReactNode; align: 'start' | 'center' | 'end'; children: ReactNode }
```

## Tokens
As Menu: `--color-card`, `--color-line`, `--radius-10`, `--shadow-popover`, padding `--space-6` (content-dependent); z `--z-popover` (200).

## Accessibility
Radix Popover: focus moves in, Escape closes, focus returns to the trigger.

## Light/dark
As Menu.

## UNDESIGNED
- A distinct popover with a header or arrow. Proposal: none, reuse the Menu surface with content padding `--space-12`.

## Used by
WorkspaceSwitcher, account menu, FilterBar pickers.

## Differs from current web
New.
