# LinkCard
Purpose: card-link to a related entity or feature (e.g. "FAQ from documents"): tile, title and a one-line description.

## Anatomy
`a` root (flex column, gap 8, padding 14, bg `--color-card`, border `--color-line`, radius `--radius-12`, no underline, text `--color-ink`; demo width 220) > NodeTile 28 (kind) + title (600) + description (12px `--color-mute`). No arrow on the card as drawn (the arrow row is LinkedItem).

## States
- default: as above.
- hover: UNDESIGNED. Proposal: border `--color-line-node`; title not underlined (it is a card, not a text link).
- focus-visible: ring outside the card, 2px gap, `--shadow-focus-ring`.
- disabled: normal colours at 45%, no hover or focus, `cursor: not-allowed`, `aria-disabled`.

## Props
```ts
type LinkCardProps = { href: string; icon: IconName; kind: NodeKind; title: string; description: string | null }
```

## Accessibility
Single link; tile decorative. Router `Link`, no Radix.

## Light/dark
Token-driven.

## Used by
Knowledge/feature entry points.
