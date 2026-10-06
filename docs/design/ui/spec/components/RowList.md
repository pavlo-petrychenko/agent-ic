# RowList
Purpose: bordered compact list of rows (schema fields, key lists) with start and end content.

## Anatomy
root (border `--color-line`, radius `--radius-8`, bg `--color-card`, overflow hidden) > row (flex, space-between, centre, gap 8, padding `--space-7` `--space-10`, bottom divider `--color-line-row`, none on last) > name (mono 12px `--color-ink`) + meta (12px `--color-mute`; may hold a Badge, e.g. "required"; plain "optional" is 11.5).

## States
Static, non-interactive. UNDESIGNED: clickable rows. Proposal: hover bg `--color-soft`, focus ring drawn inset on the row (list-row rule), disabled 45%.

## Props
```ts
type RowListProps = { rows: { id: string; name: string; meta: ReactNode | null }[]; mono: boolean }
```

## Accessibility
`ul`/`li`. No Radix.

## Light/dark
Token-driven.

## Used by
Tool parameters, variables.
