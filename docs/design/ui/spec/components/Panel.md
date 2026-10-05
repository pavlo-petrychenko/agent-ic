# Panel
Purpose: column container (list, conversation, details, inspector) with tone, side border, title row, body and bottom bars.

## Anatomy
aside[aria-label] > head row (h3 + right slot) | body | PaneBar (edge top, pushed to the bottom with margin-top:auto).

## Variants
- tone: panel (`--color-panel`) | white (`--color-card`) | bg (`--color-bg`) | none (transparent)
- side: left | right | none: border-left / border-right / no border (`--color-line`). side='left' = border on the left (panel sits on the right of the content), side='right' = border on the right.
- At compact widths a Panel used as inspector or Inbox details is hosted in a Drawer (width stays 320, see Drawer).

## States
Static.

## Props
```ts
enum PanelTone { Panel = 'panel', White = 'white', Bg = 'bg', None = 'none' }
enum PanelSide { Left = 'left', Right = 'right', None = 'none' }
interface PanelProps { title: string | null; headRight: ReactNode; tone: PanelTone; side: PanelSide; inline: boolean; ariaLabel: string; children: ReactNode; footer: ReactNode }
```

## Tokens
padding `--space-14` `--space-16`; gap `--space-14`; head title `--type-title` (13/600) `--color-ink`; body text `--type-caption` `--color-mute`; border `--border-width` `--color-line`. Panel head height 48 per Foundations is not drawn here (the page uses padding): keep padding-driven, min-height 48 (proposal).

## Accessibility
aside/section with aria-label (complementary when secondary). A scroll container that overflows needs a focusable region.

## Light/dark
Tones map to the dark surfaces; ordering bg < panel < card is kept.

## Used by
DS-Navigation (Panes), WizardFrame side panel, Inbox columns, Inspector.

## Differs from current web
New. Card is a bordered radius-12 box; Panel is flat and edge-attached.
