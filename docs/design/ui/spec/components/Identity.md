# Identity
Purpose: lead (Avatar or NodeTile) + name + sub line.

## Anatomy
root (flex, centre, gap `--space-10`, min-width 0) > lead + stack (min-width 0, truncation) > name + sub.

## Sizes
- md: Avatar 32 neutral, name 14/600 (`--type-lead-strong`), sub 12px `--color-mute` ("Telegram . Booking assistant v6").
- sm: NodeTile 22 (agent), name 13/600 (`--type-title`), sub 12px `--color-mute`.

## States
Static. Truncate with ellipsis and a `title` attribute. Clickable identities are wrapped by a link or button that owns hover, focus and disabled.

## Props
```ts
enum IdentitySize { Sm = 'sm', Md = 'md' }
type IdentityProps = { name: string; sub: string | null; lead: ReactNode; size: IdentitySize }
```

## Accessibility
Plain text; the lead is `aria-hidden` when decorative. No Radix.

## Light/dark
Token-driven.

## Used by
Conversation lists, agent headers.
