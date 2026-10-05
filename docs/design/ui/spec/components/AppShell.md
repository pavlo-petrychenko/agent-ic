# AppShell
Purpose: page layout host that places the Sidebar or Rail, the content panes and the right-hand detail panel, and switches them between docked and drawer forms by breakpoint. New: the responsive rules are drawn on DS-Patterns > Layout > Responsive (schematic boards for Flow builder, Inbox and Quick-start at 1440, 1280 and 1024; DS-Dark-Patterns is the same board in dark).

## Anatomy
div (100vh, flex row) > nav slot (Sidebar 232 or Rail 56) | main column (optional Topbar 56 across the panes) > panes (left list or palette | centre content | right detail) | Drawer host (right, compact widths only) | NarrowScreenNotice guard.

## Layouts drawn (widths in real px; boards are about 1:4)
| screen | 1440 | 1280 | 1024 (compact) |
|---|---|---|---|
| Flow builder | Rail 56, Topbar 56 over palette 232, canvas, inspector 320 | same, canvas narrower | Rail 56, Topbar, palette 232, canvas full width, inspector as a 320 Drawer over the canvas |
| Inbox | Sidebar 232, queue (about 340), chat, details 320 | (not drawn; default rule: content shrinks, details stay 320) | Rail 56, queue, chat with a "Details" button in its header, details as a 320 Drawer |
| Quick-start | Sidebar 232, wizard step, preview panel (about 360) | (not drawn) | Rail 56, wizard step full width; a "Preview" button opens the panel as a 320 Drawer |

## Rules (drawn rule text)
- Below 1280 the Sidebar collapses to the 56 Rail; the user can pin it open and it then overlays the content.
- Inspector, Inbox details and wizard preview become 320 Drawers that slide over the content from the right with `--shadow-popover`, closed by ✕ or Esc.
- Tables keep their first column and hide low-priority columns (marked in each screen spec) before scrolling horizontally (see Table).
- Minimum width 1024; narrower shows "Open on a wider screen" (NarrowScreenNotice).
- Breakpoints: `(min-width: 1440px)` wide, 1280-1439 default, `(max-width: 1279px)` compact, `(max-width: 1023px)` unsupported (tokens.md).

## Variants
`navMode`: `sidebar` | `rail` (flow builder forces `rail` at every width). `detail`: `docked` (>= 1280) | `drawer` (< 1280), derived from the viewport, not a prop the screen chooses.

## Props
```ts
enum AppShellNavMode { Auto = 'auto', Rail = 'rail' }
interface AppShellProps { navMode: AppShellNavMode; nav: ReactNode; topbar: ReactNode | null; panes: ReactNode; detail: ReactNode | null; detailOpen: boolean; onDetailOpenChange: (open: boolean) => void; detailLabel: string }
```
A `useBreakpoint()` hook in `shared` returns `wide | default | compact | unsupported` from the three media queries.

## Tokens
`--size-sidebar-width` 232, `--size-rail-width` 56, `--size-topbar-height` 56, `--size-inspector-width` 320, `--size-palette-width` 232, `--z-nav`, `--z-drawer`, bg `--color-bg`; pane borders `--color-line`.

## Accessibility
One `main` landmark (the centre content); nav landmark from Sidebar/Rail; the detail panel is a complementary region (docked) or a non-modal Drawer (compact). Resizing across 1280 keeps the open detail and focus where possible.

## Light/dark
Token-driven.

## UNDESIGNED
- 1280 boards for Inbox and Quick-start, the queue width (about 340 on the board, no token), and the docked wizard preview width (about 360 on the board vs 380 `--size-wizard-side-width`). Proposal: queue uses `--size-secondary-nav-width` 240 or a new `--size-queue-width` 340 (confirm); preview keeps 380 until confirmed.

## Used by
Every authenticated screen; Flow builder, Inbox, Quick-start wizard drawn.

## Differs from current web
New (no shell or breakpoint hook exists).
