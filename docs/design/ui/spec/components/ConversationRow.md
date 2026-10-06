# ConversationRow
Purpose: inbox row for one conversation: avatar, name, time, last message, channel/agent line, status badge (`conversation_row`).
Source: DS-Data (revised) "Record rows". States: drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
Link row: Avatar 32px circle | stack (gap 3px): [name 600 + time right], last message (1 line ellipsis), meta line [channel · agent ... Badge right].

## Variants
- `badge`: none | `You` (accent: --color-accent-light bg, --color-accent-dark text, no dot) | `Waiting` (warn with dot).
- selected / not.

## Sizes
Padding 12px 14px, gap --space-10, Avatar md 32 (--size-avatar-md), separator border-bottom --color-line-row (last none). Container card radius 12, padding 0.

## States (drawn on DS-States / DS-Dark-States unless marked)
- default: transparent.
- hover: bg `--color-soft`.
- selected: bg `--color-accent-light` + inset 2px `--color-accent` bar (`box-shadow: inset 2px 0 0 --color-accent`).
- unread: a 7px `--color-accent` dot before the name (gap `--space-6`, inside the name span); preview turns weight 600 and `--color-ink` (was `--color-ink-secondary`); name stays 600; row height unchanged.
- focus-visible: inset 2px accent ring (`--shadow-focus-ring-inset`) on the row.
- disabled: normal colours at 45% opacity, no hover/focus, not-allowed (not drawn).
- loading/empty: not drawn for lists; DS-Patterns draws them for tables only (3 Skeleton rows, filtered EmptyState with "Clear filters", err Callout with Retry) and states that live lists (runs, inbox) end with "Load more" instead of pages. Decided: Skeleton rows while loading (3 rows with a 32 avatar placeholder) and EmptyState when the list is empty (the filtered variant after filtering); the list ends with Load more.
The Waiting badge dot is drawn in the badge text colour `--color-warn` here too (see Badge dot rule).

## Props
```ts
type ConversationRowProps = { href: string; name: string; initials: string; time: string; preview: string; channel: string; agent: string; badge: 'none'|'you'|'waiting'; selected: boolean; unread: boolean };
```

## Tokens
name --type-title; time --type-small --color-mute nowrap; preview --type-caption --color-ink-secondary; meta --type-small --color-mute; Avatar md (neutral: --color-avatar-bg), fg --color-ink-secondary, 12px/600. The accent tint avatar variant uses --color-accent-light (not #D4E6E4).

## Accessibility
`<a aria-current>` in `ul`; time as `<time>`; badge text conveys state not colour alone.

## Light/dark
Token-driven; Avatar bg, badge tints and warn dot have dark values (tokens.md).

## Responsive
Below 1280px the Inbox details panel becomes a drawer over the content; the list column itself keeps its width. Min supported width 1024px.

## Used by
Conversations inbox (DS-Data Record rows).
