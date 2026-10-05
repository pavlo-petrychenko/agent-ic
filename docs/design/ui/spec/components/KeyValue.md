# KeyValue
Purpose: label/value display in three layouts: kv (stacked pairs), DefList (2-column grid), PropRow (name / value / source badges).

## Anatomy
- kv: row (flex, space-between, gap 10, 12.5px): label `--color-mute`, value right-aligned; 8px between rows (`--space-8`).
- DefList: grid 110px / 1fr (local constant), gap 8px 14px, 12.5px, align centre; labels `--color-mute`; value may be mono (`--type-mono`, `--color-ink-secondary`) or a Badge.
- PropRow: grid 124px / 1fr / auto (local constant), gap 8, padding 8px 0, bottom border `--color-line-row` except last; label `--type-mono-sm` `--color-mute`; value 12.5px; trailing SourceBadges.

## States
Static; read-only. Long values wrap (`min-width: 0`). UNDESIGNED: copy-on-hover. Proposal: trailing copy IconButton xs for ids and keys (copy icon now exists).

## Props
```ts
enum KeyValueLayout { Kv = 'kv', DefList = 'deflist', Props = 'props' }
type KeyValueProps = { items: { label: string; value: ReactNode; trailing: ReactNode | null }[]; layout: KeyValueLayout; labelWidth: number | null }
```

## Accessibility
`dl`/`dt`/`dd` for all three. No Radix.

## Light/dark
Token-driven.

## Used by
Settings summaries, contact profile.
