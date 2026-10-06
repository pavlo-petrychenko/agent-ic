# CountBadge
Purpose: small accent pill with a number (unread / needs-attention count), right-aligned in nav rows.

## Anatomy
root pill > number. The 60px-wide container in the demo is only a layout stand-in; the parent positions it with `margin-left: auto`.

## Variants / sizes
Accent only. Single size: line-height 18px (local constant), padding 0 `--space-7`, radius `--radius-pill`, 11/600 (`--type-overline` size without uppercase).
Tokens: bg `--color-accent`, text `--color-on-accent`.

## States
Static. Inside a disabled parent it dims with the parent (45%).
UNDESIGNED: overflow. Proposal: `max` prop, show "99+" above it.

## Props
```ts
type CountBadgeProps = { count: number; max: number | null }
```

## Accessibility
Plain span; the parent row carries the accessible label ("3 unread"). No Radix.

## Light/dark
Token-driven; keep `--color-on-accent` paired (dark accent is lighter, text turns dark).

## Used by
NavItem, SubnavItem, ListItem.
