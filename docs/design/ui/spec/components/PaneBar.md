# PaneBar
Purpose: horizontal strip at top or bottom of a pane for composer, filters or footer notes.

## Anatomy
div (border on one edge) > content; optional row layout.

## Variants
- edge: top | bottom (border-top / border-bottom)
- tone: panel | white | none
- row: boolean (flex, space-between, gap `--space-10`, centred)
- line: standard `--color-line` or soft `--color-line-row` (line2)
- push: margin-top:auto (anchors to the bottom of a Panel)

## States
Static; contained controls own states.

## Props
```ts
enum PaneBarEdge { Top = 'top', Bottom = 'bottom' }
enum PaneBarTone { Panel = 'panel', White = 'white', None = 'none' }
interface PaneBarProps { edge: PaneBarEdge; tone: PaneBarTone; row: boolean; softLine: boolean; push: boolean; children: ReactNode }
```

## Tokens
padding `--space-12` `--space-16`; bg `--color-panel` / `--color-card` / transparent; border `--color-line`, soft `--color-line-row`; text `--type-caption` `--color-mute`; action buttons are sm = 28 (`--size-control-sm`; was 30).

## Accessibility
Plain container; if it holds a form, wrap in form/role=group with a label.

## Light/dark
Token-driven.

## Used by
DS-Navigation (Pane bars inside panes). Inbox composer, filters.

## Differs from current web
New.
