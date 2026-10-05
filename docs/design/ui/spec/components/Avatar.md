# Avatar
Purpose: circular initials (user, contact, workspace member), optional image. The square logo mark in the Sidebar is not an Avatar.
Merged from: DS-Display and DS-Navigation. States: drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
root circle > initials (centred, weight 600) or image.

## Variants / sizes
- size: sm `--size-avatar-sm` 24 (font 9px, local constant below the type scale), md `--size-avatar-md` 32 (font 12 = `--type-caption`), lg `--size-avatar-lg` 40 (font 15 = `--type-h3`).
- tone: neutral (bg `--color-avatar-bg`, text `--color-ink-secondary`), accent (bg `--color-accent-light`, text `--color-accent-dark`; the old #D4E6E4 tint is removed by design), solid (bg `--color-accent`, text `--color-on-accent`).
- shape: circle (`--radius-pill`).

## States (drawn on DS-States / DS-Dark-States)
Static; not interactive (a clickable avatar is wrapped by the parent button, which owns focus and disabled).
- image: photo cropped to the circle (`object-fit: cover`) with `--shadow-swatch-inset` (inset 1px `--color-hairline`); placeholder drawn as `image` icon 14 `--color-mute` on `--color-avatar-bg`.
- loading or failed image: show initials on `--color-avatar-bg` (`--color-ink-secondary`). Initials = first letters of first and last name.
- with status: 10px dot (`--color-ok-dot` in the sample), bottom-right at -1px, ring `0 0 0 2px --color-card`.
- stack: sm 24 avatars overlapping by -6px, each with a `0 0 0 2px --color-card` ring; overflow chip 24 circle, bg `--color-soft`, text `--color-mute` 10/600 ("+2").

## Props
```ts
enum AvatarSize { Sm = 'sm', Md = 'md', Lg = 'lg' }
enum AvatarTone { Neutral = 'neutral', Accent = 'accent', Solid = 'solid' }
type AvatarProps = { initials: string; size: AvatarSize; tone: AvatarTone; src: string | null; name: string | null; status: StatusKind | null }
type AvatarStackProps = { avatars: AvatarProps[]; max: number }
```

## Accessibility
`aria-hidden` when a name sits next to it; otherwise `role="img"` with `aria-label={name}`. Radix Avatar only if images ship (inside `shared/ui`).

## Light/dark
Token-driven; `--color-avatar-bg` and the accent pair have dark values in tokens.md.

## Used by
Sidebar footer, PaneHeader, Menu rich rows, WorkspaceSwitcher menu, ConversationRow, TableCellLead, Identity, account menu.

## Differs from existing
No Avatar in `shared/ui`.
