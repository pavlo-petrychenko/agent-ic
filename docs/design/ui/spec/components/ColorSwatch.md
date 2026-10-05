# ColorSwatch
Purpose: circular colour choice button (chart or custom colour pickers).
Source: DS-Actions v2 (Colour swatch). Blue and violet appear only as sample user colours; they are not product accents. States: drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
28px circle button filled with the colour (user data: raw hex, not a token).

## Variants and states
- size 28 (`--size-control-sm`), radius `--radius-pill`, no border.
- default: `--shadow-swatch-inset` (inset 1px ring; token has a dark value per designer).
- selected (`aria-pressed="true"`): `0 0 0 2px --color-card, 0 0 0 4px --color-ink` (ink ring, local constant; this is selection, not focus).
- hover (drawn on DS-States): ring `0 0 0 2px --color-card, 0 0 0 4px --color-line-dash` (replaces the inset hairline while hovered).
- focus-visible (drawn on DS-States for an unselected swatch): `0 0 0 2px --color-card, 0 0 0 4px --color-accent`, replacing the hairline. Focus on a selected swatch: still UNDESIGNED (rings collide). Proposal: selected adds an accent ring outside the ink ring (`... , 0 0 0 6px --color-card, 0 0 0 8px --color-accent`).
- disabled: global rule.

## Props
```ts
type ColorSwatchProps = { color: string; label: string; selected: boolean; onSelect: () => void }
```

## Accessibility
Button, `aria-label` ("Colour #RRGGBB" or name), `aria-pressed`. A group: wrapper `role="group"` with a label, or Radix `RadioGroup` (arrow keys).

## Light/dark
Drawn on DS-Dark-Actions: default inset ring = `--color-hairline` rgba(255,255,255,.10); selected = `0 0 0 2px #211F1C (card), 0 0 0 4px #ECE8E1 (ink)`. Swatch fill is user data and does not change with theme.
