# NavItem
Purpose: single navigation link in the Sidebar (expanded) or Rail (icon-only) with optional count badge.
Source (states): drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
a > Icon (16 in sidebar, 17 in rail) + label + optional count (margin-left:auto). Rail variant: icon only, aria-label, Tooltip.

## Variants / sizes
- layout: sidebar (h 34, full width) | rail (40 x 36 centred; `--size-rail-item-width` / `-height`)
- active: boolean (aria-current="page")

## States (drawn on DS-States / DS-Dark-States)
- default: bg transparent, label `--color-ink` weight 400, icon `--color-mute`.
- hover: bg `--color-soft`, transition `--duration-fast`; the selected item stays chip.
- active (pressed, drawn): bg `--color-chip`, label stays 400, icon stays `--color-mute`.
- selected / current page (`aria-current="page"`): bg `--color-chip`, label weight 600, icon `--color-accent` (no left bar).
- focus-visible: sidebar rows use the inset ring `inset 0 0 0 2px --color-accent` (`--shadow-focus-ring-inset`); rail items use the outside ring `--shadow-focus-ring` (see Rail).
- disabled: normal colours at `--opacity-disabled` (.45), no hover or focus, `cursor: not-allowed`, not a link target (`aria-disabled`); the drawn disabled item shows no count badge.

## Props
```ts
enum NavItemLayout { Sidebar = 'sidebar', Rail = 'rail' }
interface NavItemProps {
  to: string;
  label: string;
  icon: ReactNode;
  layout: NavItemLayout;
  active: boolean;
  disabled: boolean;
  badgeCount: number | null;
}
```

## Tokens
- height `--size-control-md` (34); padding 0 `--space-10`; gap `--space-10`; radius `--radius-8`; font `--type-body`
- count: CountBadge (padding 0 `--space-7`), radius `--radius-pill`, bg `--color-accent`, color `--color-on-accent`, font `--type-overline` (11/600, no uppercase), line-height 18
- icon names on the page: agent, compl, kb, tool, channels, inbox, user, traces, flask, chart, code, gear

## Accessibility
Router link; aria-current="page" when active; rail variant keeps its name via aria-label and shows a Tooltip. Count is part of the name (visually hidden "3 unread").

## Light/dark
Token-driven; active chip against `--color-ink` and the accent count (dark text on teal in dark) keep contrast.

## Used by
Sidebar, Rail.

## Differs from current web
New. Closest: Link.
