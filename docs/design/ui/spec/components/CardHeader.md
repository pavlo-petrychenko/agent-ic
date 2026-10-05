# CardHeader
Purpose: title row of a card with optional right slot, subtitle and tag/badge.

## Anatomy
row (flex, space-between, width 100%, gap 8; gap 12 and `align-items: flex-start` when a sub line is present, else center) > left (title [+ Badge inline, gap 10] + sub) + right slot (flex, gap 8, shrink 0).

## Rules
- Title only: 13/600 `--type-title`, rendered as h3.
- With a sub line: 15/600 `--type-h3`; sub 12px `--type-caption` `--color-mute`, stack gap `--space-2`.
- Right slot: secondary Button sm (28, `--size-control-sm`; was 30), danger Button sm (border `--color-err-line`, text `--color-err`), or a standalone action link (12/600 `--color-accent`, underline on hover only).

## Props
```ts
type CardHeaderProps = { title: ReactNode; sub: ReactNode | null; right: ReactNode | null; tag: ReactNode | null; headingLevel: 2 | 3 | 4 }
```

## Accessibility
Heading level is a prop, decoupled from size. Right-slot controls carry their own focus ring. No Radix.

## Light/dark
Token-driven.

## Used by
Card contents; page DS-Display (Card header).
