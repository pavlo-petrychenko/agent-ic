# Rail
Purpose: collapsed icon-only Sidebar. Used in the flow builder and, below 1280px, everywhere.
Source (states): drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
nav[aria-label="Main (collapsed)"] > logo mark 28 | NavItem(rail)[] | divider (24 x 1) | flex spacer | bottom NavItems (Developer, Settings).

## Variants / sizes
Width 56 (`--size-rail-width`). Items 40 x 36 (`--size-rail-item-width` / `-height`) radius `--radius-8`, icon 17. Triggers: the flow builder at every width (drawn on DS-Patterns > Responsive: the flow-builder boards show the 56 rail at 1440, 1280 and 1024) and every other screen below 1280 (automatic; drawn on the Inbox and Quick-start 1024 boards). Below 1280 the user can pin the full Sidebar open; the pinned Sidebar overlays the content instead of pushing it (drawn rule: "the user can pin it open; it then overlays").

## States (drawn on DS-States / DS-Dark-States)
- default: bg transparent, icon 17 `--color-mute`.
- hover: bg `--color-soft`, icon `--color-ink`, plus a Tooltip to the right (gap `--space-8`) with the label and count ("Inbox · 3"), no arrow.
- selected: bg `--color-chip`, icon `--color-accent`.
- focus-visible: outside ring `--shadow-focus-ring` (items are standalone controls); the Tooltip also shows on focus.
Tooltip timing (page): appears after 400ms on hover and focus. Disabled: per NavItem (not drawn).

## Props
```ts
interface RailProps { logo: ReactNode; groups: NavItemData[][]; footerItems: NavItemData[]; ariaLabel: string }
```

## Tokens
bg `--color-panel`; border-right `--color-line`; z `--z-nav`; padding `--space-12` 0; gap `--space-4`; divider bg `--color-line` margin `--space-6` 0, width 24; logo margin-bottom `--space-10`.

## Accessibility
nav landmark; each link has aria-label; Tooltip names the item. Where the account menu, theme and language go in the Rail is still open (see UNDESIGNED below).

## Light/dark
Token-driven.

## UNDESIGNED
- Where the workspace switcher, account menu (with theme toggle) and unread count go when the Sidebar is a Rail. Proposal: logo mark is the WorkspaceSwitcher trigger (opens the same Menu to the right); unread count is a 8px `--color-accent` dot on the Inbox item; account menu from a bottom Avatar item.
- Expand / pin control: the behaviour is drawn (below 1280 the user can pin the Sidebar open and it overlays the content); the control's look and place are not. Proposal: a 28 IconButton (`panel`) under the logo; the pinned Sidebar is a 232 overlay with `--shadow-popover` and z `--z-drawer`, closed by its collapse button or Esc; whether the pin is remembered per user is not stated (proposal: yes).

## Used by
DS-Navigation (App shell); flow builder; every screen below 1280.

## Differs from current web
New.
