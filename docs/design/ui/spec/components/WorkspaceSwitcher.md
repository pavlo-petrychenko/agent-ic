# WorkspaceSwitcher
Purpose: sidebar header button showing logo, workspace name and role, with chevron; opens the account menu (Menu, rich rows).
Source (states): drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
button > logo mark 28 | two-line text (name 600, role "Workspace") | `chevron-down` 12 (renamed from `chev`).

## Tokens
height 40 (`--size-control-lg`), padding 0 `--space-8`, gap `--space-10`, radius `--radius-8`, bg transparent; logo 28 `--color-accent` / `--color-on-accent` radius `--radius-8`; name `--type-title` 600; role `--type-small` `--color-mute`; chevron `--color-mute`; leading `--leading-tight` (1.2) for the two lines. Menu opens at left 12 below the button, z `--z-popover`.

## Account menu content (decided)
The account menu is the switcher's Menu: Workspaces list (rich rows: Avatar sm 24 + title 13/600 + "Role · N members" 12 mute + trailing check), Account list, and a Theme row with Light / Dark / System (icons sun, moon, monitor; per person, stored on the user; System follows prefers-color-scheme). The same theme control is in Settings > Profile. The theme control itself is ThemeToggle. Its placement is drawn on DS-Patterns > Theme ("account menu"): Menu 280 with rows Profile (`user` 14, hint = user name) · Theme (`moon` 14, trailing icon-only ThemeToggle `menu`, right-aligned in the hint slot, not full width) · Log out (`x` 14); no Divider drawn. The board shows only this account part (no Workspaces list): OPEN, proposal Workspaces list, Divider, then Profile / Theme / Log out.

## Props
```ts
interface WorkspaceSwitcherProps { current: { name: string; roleLabel: string }; options: { id: string; name: string; roleLabel: string; memberCount: number }[]; onSelect: (id: string) => void }
```

## States (drawn on DS-States / DS-Dark-States)
default (transparent); hover bg `--color-soft`; open (`aria-expanded="true"`) bg `--color-chip`; focus-visible outside ring `--shadow-focus-ring`; disabled: global rule (not drawn). Logo tile stays `--color-accent` / `--color-on-accent` in every state.

## Accessibility
button aria-haspopup=listbox aria-expanded for workspace choice; the account menu as a whole mixes selection and actions: Radix Popover with a listbox for workspaces and plain buttons for account actions. Focus returns to the button on close.

## Light/dark
Token-driven.

## Used by
Sidebar; MVP-Agents-AccountMenu (open state). In the Rail the logo mark takes this role (UNDESIGNED, see Rail).

## Differs from current web
New.
