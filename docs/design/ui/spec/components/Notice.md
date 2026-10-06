# Notice
Purpose: notification-like row: NodeTile + title + meta + action (inbox / feed item).

## Anatomy
Card(pad 12) > row (flex, gap 12, padding 14px 0) > NodeTile 28 (tone) + stack (gap `--space-3`: title 600 13px, meta 12px `--color-mute`, action margin-top 2). Action: text button, accent 12.5/600, height 22 (`--size-control-xs`).
The Card wrapper is demo only; in a feed the rows sit in one Card divided by `--color-line-row` (see AttentionCard).

## States
Static; the action is a Button/Link with its own states (standalone: underline on hover only; focus ring outside, 2px gap).

## Props
```ts
type NoticeProps = { tone: NodeKind; icon: IconName; title: string; meta: string | null; action: { label: string; onClick: () => void } | null }
```

## Accessibility
`li` in a list; the action is a button or link with a visible name that includes context. No Radix.

## Light/dark
Token-driven (tile hue pairs designed for all kinds).

## Used by
Inbox attention list, AttentionCard.
