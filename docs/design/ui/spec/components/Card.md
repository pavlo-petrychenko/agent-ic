# Card
Purpose: base container surface for grouped content.
Anatomy: section root (flex column, gap) > children; optional CardHeader first.

## Variants (tone)
- default: bg `--color-card`.
- panel: bg `--color-panel` (Plan summary).
- sunken: bg `--color-bg`, pad 12, gap 6; chat transcript wells (bubbles inside are `--color-card` and violet-light).
Common: border `--border-width` `--color-line`, radius `--radius-12`, no shadow. pad prop 12 / 14 / 16 (`--space-12/14/16`; default 14; 16 when it wraps a list or EmptyState, 12 for Notice rows); gap `--space-10` default, 8 or 12 per use.

## States
- static: default.
- selected: 2px (`--border-width-strong`) `--color-accent` border plus a 4px soft accent halo (`--shadow-selected` = `0 0 0 4px var(--color-accent-glow)`). This is selection, not focus. Compensate the extra 1px so nothing shifts (margin -1 as drawn, or padding -1).
- hover / focus / disabled: a plain Card is not interactive and has none. Interactive cards are OptionCard and LinkCard (own focus ring and disabled rule).

## Props
```ts
enum CardTone { Default = 'default', Panel = 'panel', Sunken = 'sunken' }
type CardProps = { tone: CardTone; pad: 12 | 14 | 16; gap: number; selected: boolean; as: 'section' | 'div' | 'li'; children: ReactNode }
```

## Accessibility
`section` needs `aria-labelledby` when it has a heading. A selected Card that is not a control must also state selection in text or `aria-current`. No Radix.

## Light/dark
Token-driven. Sunken stays darker than default in both themes.

## Used by
Everywhere; page DS-Display (Containers).

## Differs from existing
`shared/ui/Card` exists (props `title`, children). Add `tone`, `pad`, `gap`, `selected` (2px accent border + 4px halo, selection not focus), `as`; keep `title`; zero-padding/overflow hidden for tables.
