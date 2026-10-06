# Drawer
Purpose: side panel that overlays the content at compact widths (1024-1279): flow-builder Inspector, Inbox details, wizard preview.

## Status
Behaviour and sizes are decided in Foundations and now drawn on DS-Patterns > Layout > Responsive (schematic boards at about 1:4 scale plus a rule text; DS-Dark-Patterns is the same board in dark tokens). Drawn: one width, 320, for all three hosts; the drawer slides over the content from the right with `--shadow-popover` ("shPop"); it closes with its ✕ button or Esc. Still UNDESIGNED: scrim, outside-click behaviour, Topbar inset, motion.

## Anatomy
aside[aria-label] (right edge; in the flow builder it sits over the canvas below the Topbar; in the Inbox it covers the right of the chat at full height) > hosted Panel content (Inspector, Inbox details, wizard Preview) with its own ✕ close.

## Variants / sizes
- width: 320 (`--size-inspector-width`) for Inspector, Inbox details and wizard preview (drawn rule: "Inspector, Inbox details and wizard preview become 320 drawers"; the wizard preview was 380 in v2).
- side: right only.
- Appears only below 1280; at >= 1280 the same content is a docked Panel. Opening is user-driven: node select (flow), the "Details" button in the chat header (Inbox, drawn on the 1024 Inbox board), the "Preview" button (wizard, drawn on the 1024 Quick-start board).

## States
closed | open. Motion is not on the page; use the tokens: open slides from the right over `--duration-slow` (320) `--ease-enter`; close about 256ms `--ease-exit`; reduced motion: opacity only, at most 120ms. Disabled: n/a.

## Props
```ts
interface DrawerProps { open: boolean; onOpenChange: (open: boolean) => void; ariaLabel: string; width: number | null; children: ReactNode }
```

## Tokens
bg `--color-panel`; border-left `--border-width` `--color-line`; shadow `--shadow-popover` (drawn); z `--z-drawer` (300, below the dialog scrim 400 so a Dialog can open over it); no scrim (UNDESIGNED proposal; the page draws none). The boards draw the drawer as a dashed `--color-line-dash` box filled `--color-accent-light`: that is the schematic's "overlay" marker, not the drawer's fill.

## Accessibility
Non-modal complementary region: no focus trap; Escape and the hosted ✕ button dismiss (drawn rule); focus returns to the opener (node, Details button or Preview button). Selecting another node replaces the content without closing.

## Light/dark
Token-driven; dark shadow 0 12px 32px rgba(0,0,0,.55) (DS-Dark-Patterns uses the dark popover shadow everywhere it draws shPop).

## UNDESIGNED
- Scrim yes or no, outside-click dismissal, inset from the Topbar, open and close motion. Proposal: no scrim, outside click does not dismiss (the canvas stays interactive), Escape and ✕ do; motion as in States.

## Used by
Inspector, Inbox details, WizardFrame preview, the pinned Sidebar overlay below 1280 (see Rail).

## Differs from current web
New.
