# BulletList
Purpose: compact bullets of changes or reasons.

## Anatomy
ul (margin 0, padding-left `--space-18`) > li. `--type-body-small` (12.5), `--color-ink-secondary`, `--leading-relaxed` (1.45). Demo sits in Card pad 16.

## States
Static. In-sentence links inside items are always underlined.

## Props
```ts
type BulletListProps = { items: ReactNode[] }
```

## Accessibility
Native `ul`. No Radix.

## Light/dark
Token-driven.

## Used by
Version history cards, run summaries.
