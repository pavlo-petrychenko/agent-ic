# Breadcrumb
Purpose: location trail in two forms: PageHeader crumbs (links above the title) and the Topbar trail (full path ending in the current item).

## Anatomy
`nav[aria-label]` > `ol` > `li` links separated by a "/" (aria-hidden) > current item (`aria-current="page"`, not a link). PageHeader crumb form on the page shows a single link (parent) with no separator.

## Variants
- header: font `--type-caption` (12), gap `--space-6`, links only.
- topbar: gap `--space-8`, links `--type-body`, current item `--type-h3` (15/600) `--color-ink`.

## States
Crumb links are standalone links: colour `--color-mute`, no underline at rest, hover `--color-ink` plus underline (standalone-link rule), focus-visible outside ring `--shadow-focus-ring`. Separator `--color-mute`. Disabled: n/a.

## Props
```ts
enum BreadcrumbSize { Header = 'header', Topbar = 'topbar' }
type BreadcrumbProps = { items: { label: string; to: string | null }[]; size: BreadcrumbSize; ariaLabel: string }
```

## Accessibility
`nav` + `ol/li`; `aria-current="page"` on the last item; separators hidden from AT. No Radix.

## Light/dark
Token-driven.

## UNDESIGNED
- Truncation of long trails (compact widths). Proposal: collapse middle items to "..." Menu when the trail exceeds the available width; current item truncates with ellipsis.

## Used by
PageHeader, Topbar; DS-Navigation, DS-Display, MVP-Settings-Team.

## Differs from existing
New. Crumb links are muted, not accent like `Link`.
