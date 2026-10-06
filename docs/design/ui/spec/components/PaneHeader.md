# PaneHeader
Purpose: header bar of a pane (conversation, detail) with identity on the left and sm actions on the right.

## Anatomy
div > left [Avatar 32 + title (600 14) + subtitle (12 mute)] | right actions.

## Variants / sizes
Two heights: 64 chat header (the page sample) and 48 panel header (Foundations `layout.paneHeader` 48 | 64). Token `--size-pane-header-height` (64) plus panel header 48 (name for the 48 value is up to the Foundations agent). Avatar is shown in the 64 form only (proposal; the 48 form is not drawn on this page).

## States
Static; actions own states (disabled: global rule).

## Props
```ts
interface PaneHeaderProps { left: ReactNode; right: ReactNode; height: 48 | 64 }
```

## Tokens
padding 0 `--space-18`; bg `--color-panel`; border-bottom `--color-line`; gap `--space-12`; Avatar md 32 neutral (bg `--color-avatar-bg`, fg `--color-ink-secondary`, 12/600); title `--type-lead-strong` (14/600); subtitle `--type-caption` `--color-mute`; action Button sm 28 (`--size-control-sm`; the old 30 `--size-control-compact` is removed), primary variant with `agent` icon in the sample.

## Accessibility
Use a heading for the title; truncate with min-width 0.

## Light/dark
Token-driven.

## Used by
DS-Navigation (Pane bars). Inbox conversation pane. At compact widths the Inbox details drawer sits to the right of this pane.

## Differs from current web
New.
