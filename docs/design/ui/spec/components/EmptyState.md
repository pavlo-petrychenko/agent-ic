# EmptyState
Purpose: first-run / nothing-found / all-done placeholder with one clear next action.

## Anatomy
root (flex column, centre, gap 8, padding 40px 24px) > NodeTile 34 + title (h2, 15/600 `--type-h3`, `--color-ink`) + description (13px `--type-body`, `--color-mute`, centred, max-width 420, line-height `--leading-relaxed` 1.45; the page's 1.5 is not a token) + optional actions row (gap 8, margin-top 6; Button md 34, primary, leading plus icon).

## Variants (kind)
Tile kind sets the hue: kb (brand, "No sources yet" with a primary action) or ok ("Nothing needs you", no actions). Other tile kinds as needed. Container: bare, or inside Card (pad 16, gap 12).
Drawn on DS-Patterns (DS-Dark-Patterns in dark):
- filtered (Table > "empty (after filtering)"): tile neutral (`--hue-neutral-bg` / `-fg` = `--color-soft` / `--color-ink-secondary`), icon `filter` 17; title "No agents match these filters"; description "Clear a filter or search for another name."; one secondary Button sm 28 "Clear filters" (no icon). Sits in the table body under the kept header row. Rule: empty after filtering = this variant; empty with no data = the page's first-run empty state.
- error (Page states > "page error"): tile err (`--color-err-light` / `--color-err`), icon `alert` 17; title "Couldn’t load this knowledge base"; description with recovery and a support code ("Check your connection and try again. If it keeps happening, contact support with code KB-504."); primary Button md 34 "Try again" with leading `refresh` 13. Container: Card radius `--radius-12`, padding `--space-8`, gap `--space-12`, width 420 in the sample. Rule: keep navigation usable while a page fails.
Icon size in the 34 tile is 17 in every drawn variant.

## States
Static. Actions carry Button states. Error variant: drawn on DS-Patterns (see Variants); it replaces the v2 proposal. Note: the page's primary Button sets `font-weight: 600` then `font: inherit`, so the label renders at 400 (same as INDEX section 7, item 15).

## Props
```ts
type EmptyStateProps = { icon: IconName; kind: NodeKind; title: string; description: string | null; actions: ReactNode | null; headingLevel: 2 | 3 }
```

## Accessibility
Configurable heading level; icon decorative; no autofocus needed. No Radix.

## Light/dark
Token-driven.

## Used by
Knowledge sources, escalations inbox, Table (filtered empty), page-level load errors (Page states).
