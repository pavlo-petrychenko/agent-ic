# AttentionCard
Purpose: card with title and list rows, each row an icon tile + title, meta line and action link ("Needs attention").
Pages: DS-Foundations (dark panel, 320px wide, one row `hand` / "2 chats are waiting for a person" / "oldest 4 min" / "Open inbox"); likely DS-Display/Data owner. Composition of `Card` + `CardHeader` + `Notice`-style rows (the DS-Display Notice row is the same row; build the row once as Notice and let AttentionCard map over rows).
Anatomy: section card > header (h3 title, optional right slot) > rows: icon tile (28) | text column (title 600, meta, action link).
Variants: row tone via NodeTile kind (here info/accent).
Sizes: card padding 14px 16px 4px (rows add 14px vertical padding, gap 12); card gap 4.
States: link hover (underline, `--color-accent-dark`) and focus (ring outside, 2px gap) per Link; rows static, not clickable as a whole. Empty and loading: UNDESIGNED, proposal: hide the card when there are no rows; Skeleton rows while loading. Row dividers between multiple rows: UNDESIGNED on this page (proposal: 1px `--color-line-row`).
Props: `{ title: string; rows: Array<{ id: string; icon: IconName; title: string; meta: string | null; action: { label: string; href: string } | null }> }`.
Tokens: bg `--color-card`; border 1px `--color-line`; radius `--radius-12`; title `--type-title` `--color-ink`; row title 600 13px; meta `--type-caption` `--color-mute`; link 12px/600 `--color-accent` (standalone action link: no underline at rest, underline on hover); tile per NodeTile (28, kind info in the sample); row gap 3 between title, meta and link, link margin-top 2.
Accessibility: card as `section` with `aria-labelledby`; rows in `ul`; link is a real anchor with visible focus ring. No Radix.
Light/dark: designed. Dark card #211F1C, border #34312C, title #ECE8E1, tile #16302E/#86D4CC, meta #A29C92, link #4DB6AE.
Repo diff: Card exists in shared/ui; this composes it.
