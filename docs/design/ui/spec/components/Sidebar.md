# Sidebar
Purpose: persistent left app navigation with workspace switcher, grouped NavItems, utility links and user/language footer.

## Anatomy
nav[aria-label=Main] > WorkspaceSwitcher + CollapseButton (IconButton sm, icon `panel` 14) | NavGroup[] (NavSectionLabel + NavItem[]) | spacer (margin-top:auto) bottom group (Developer, Settings) | footer (Avatar sm 24 accent tint + name/role, SegmentedControl language).

## Variants / sizes
- expanded: width 232 (`--size-sidebar-width`), viewport >= 1280.
- rail: below 1280 the Sidebar is replaced by the Rail (56) automatically; the flow builder also uses the Rail at any width (see Rail). Drawn on DS-Patterns > Responsive (Inbox and Quick-start boards: Sidebar 232 at 1440, Rail 56 at 1024).
- pinned overlay (below 1280, drawn rule): the user can pin the Sidebar open; it then overlays the content (232, not pushing the layout). Look of the overlay: see Rail (UNDESIGNED proposal).

## States
Item states live in NavItem. Collapse button: IconButton sm (28): hover bg `--color-soft`, focus-visible `--shadow-focus-ring`, disabled per the global rule. Hover and focus are rules from Foundations; the page draws only the rest state.

## Props
```ts
interface SidebarProps {
  workspace: { name: string; roleLabel: string };
  groups: { id: string; label: string | null; items: NavItemData[] }[];
  footerItems: NavItemData[];
  user: { name: string; roleLabel: string };
  onCollapse: () => void;
  collapseLabel: string;
  ariaLabel: string;
}
```

## Tokens
- bg `--color-panel`; border-right `--border-width` `--color-line`; z `--z-nav`
- padding `--space-14` `--space-12`; gap between groups `--space-18`; items gap `--space-2`
- footer: border-top `--color-line`, padding `--space-10` `--space-4` 0
- collapse button 28 (`--size-control-sm`), icon `--color-mute`, radius `--radius-8`
- user avatar: Avatar sm 24, bg `--color-accent-light`, fg `--color-accent-dark`, 9/600 (the old #D4E6E4 is gone); name `--type-body-small-strong` (12.5/600), role `--type-hint` (11) `--color-mute`
- workspace button: see WorkspaceSwitcher

## Accessibility
nav landmark with label. Items are links with aria-current="page". Collapse button has aria-label. Footer language switch is a role=group of aria-pressed buttons. No Radix (switcher uses Menu/Popover). Below 1280 the landmark label becomes the Rail's "(collapsed)" label.

## Light/dark
All colours are tokens; dark values come from the dark set. Logo mark is `--color-accent` with `--color-on-accent` (dark theme turns the mark text dark). Accent is teal only (blue/violet are design-tool options, no values).

## UNDESIGNED
- Manual collapse of the Sidebar to the Rail at >= 1280 (the collapse button is drawn, the resulting state outside the flow builder is not; DS-Patterns covers only the opposite case, pin-open below 1280). Proposal: allowed at any width, remembered per user; the Rail keeps the expand button below the logo.

## Used by
DS-Navigation (App shell). Screens: MVP-Agents-AccountMenu, MVP-Settings-Team, MVP-NoAccess, MVP-Testing, Traces, Traces-Timeline.

## Differs from current web
No Sidebar exists yet. The repo has no sidebar token yet; use `--size-sidebar-width` (232) and `--size-rail-width` (56).
