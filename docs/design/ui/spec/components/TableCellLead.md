# TableCellLead
Purpose: two-line table cell with leading avatar or icon tile, title and subtitle (`cell2(title, sub, lead)`).

## Anatomy
Lead (32-34px) + stack: title (weight 600) over subtitle (ellipsis).

## Variants
- `lead`: `icon` (34px square, radius 8, tinted bg + coloured glyph e.g. violet for agent) | `avatar` (32px circle, initials 12px/600, neutral bg `--color-avatar-bg`, text --color-ink-secondary). Avatar tint now uses --color-accent-light (the #D4E6E4 value is gone); the neutral fallback is unchanged on the page.

## Sizes
Lead 34 (icon, --size-tile-lg) / 32 (avatar md, --size-avatar-md). Gap --space-10. Row padding 12px 16px. DS-Patterns > Table draws the icon lead at 28 (NodeTile md, radius 8, icon 15), title 13/600, subtitle 11.5 `--color-mute` ellipsis, row padding 10px 14px, preceded by an 11px expansion chevron (gap 8): OPEN, add `size: 'md' | 'lg'` (28 / 34).

## States
Follows row (selected bg on row). None own.

## Props
```ts
type TableCellLeadProps = { title: string; subtitle: string | null; lead: { kind: 'icon'; icon: ReactNode; tone: 'violet'|'ok'|... } | { kind: 'avatar'; initials: string } };
```

## Tokens
Title: --type-body weight 600 (--type-title) --color-ink. Subtitle --type-small --color-mute, nowrap ellipsis. Icon tile bg --color-violet-light, fg --color-violet, radius --radius-8. Avatar md neutral (bg --color-avatar-bg), radius --radius-pill. Icon 17px stroke 1.5.

## Accessibility
Decorative lead `aria-hidden`; initials avatar gets name from adjacent title.

## Light/dark
Hue tile pairs have dark values (tokens.md).

## Used by
DS-Data table "cell2 leads": Booking assistant (agent), Olena K., Gift card helper. Pairs with Badge (dot). Shared lead/NodeTile concept also appears in ListItem.
