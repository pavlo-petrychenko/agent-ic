# SecondaryNav
Purpose: second column listing the objects of one area (Settings, Knowledge, Channels, Prompts; tools and API connections on the page) with section headers and create actions.

## Anatomy
section[aria-label] > header (h1 title + "New" IconButton sm, min-height 34) | group[] (NavSectionLabel with action + ListItem[]).

## Variants / sizes
Width 240 (`--size-secondary-nav-width`). Below 1280 it stays (only the Sidebar collapses).

## States
Items are `ListItem` rows (same component as DS-Data lists): default transparent; selected bg `--color-chip`; hover bg `--color-soft`; focus-visible = inset ring `inset 0 0 0 2px --color-accent` (rows in a list); disabled per global rule (45%, no hover or focus, not-allowed). Selected row also takes the 2px accent indicator (inset left) only if the page draws it: it does not here, so selected = chip only.

## Props
```ts
interface SecondaryNavProps {
  title: string;
  ariaLabel: string;
  action: { label: string; onClick: () => void } | null;
  groups: { id: string; label: string; action: { label: string; onClick: () => void } | null; items: ListItemData[] }[];
}
interface ListItemData { id: string; to: string; title: string; subtitle: string | null; monoTitle: boolean; tile: { icon: ReactNode; tone: ObjectTone }; selected: boolean }
enum ObjectTone { Tool = 'tool', Api = 'api' }
```

## Tokens
- bg `--color-panel`; border-right `--color-line`; padding `--space-18` `--space-12`; gap `--space-14`
- title `--type-h1` (22/600, `--tracking-tight`); header padding 0 `--space-4`
- new button: 28 (`--size-control-sm`), border `--border-width` `--color-line`, bg `--color-card`, radius `--radius-8`, icon `plus` 14
- group action: IconButton ghost 28, icon `plus` 14, `--color-mute`
- item: padding `--space-7` `--space-10`, gap `--space-10`, radius `--radius-8`; NodeTile md 28 radius `--radius-8`
- tile tones: tool = `--hue-tool-bg/fg`, api = `--hue-api-bg/fg` (dark pairs exist in the 18-kind hue table)
- title: mono `--type-mono` (12) `--color-ink` for tool names, else 13/500; subtitle `--type-small` `--color-mute`, nowrap ellipsis

## Accessibility
section with label; list as ul of links; aria-current on selected. Title is an h1 in the design: keep one h1 per page, render h2 when PageHeader is present.

## Light/dark
Token-driven; tile tones use the dark hue pairs.

## Used by
DS-Navigation (App shell). Tools, API connections, Knowledge, Settings, Channels, Prompts screens.

## Differs from current web
New.
