# PageHeader
Purpose: page title block with optional breadcrumbs, subtitle, right-aligned actions, optional tabs row and bottom divider.

## Anatomy
header > row(align-items:flex-end, justify between, gap 16) [ left: Breadcrumb? + h1 (+ mono title) + subtitle ; right: actions ] | Tabs? (inside header).

## Variants / sizes
- monoTitle: boolean (title in `--font-mono` `--type-h1-mono`, 21/500)
- divider: boolean (border-bottom `--color-line`; auto true when tabs present)
- Header actions are md buttons (34); card and pane buttons are sm (28). Actions may include a SegmentedControl (page: "7 days / 30 days").
- Tabs row: tab height 40, gap 22, selected indicator 2px `--color-accent` (`--border-width-strong`), selected weight 600.

## States
Static; actions and tabs own their states.

## Props
```ts
interface PageHeaderProps {
  title: string;
  subtitle: string | null;
  breadcrumbs: { label: string; to: string }[];
  actions: ReactNode;
  tabs: ReactNode;
  monoTitle: boolean;
  divider: boolean;
}
```

## Tokens
bg `--color-bg`; padding `--space-18` `--space-page-gutter` (28) 0; inner gap `--space-12`; left stack gap `--space-3`; title `--type-h1`; subtitle `--type-body-small` (12.5) `--color-mute`; crumbs `--type-caption` `--color-mute` gap `--space-6`; actions gap `--space-8`; border `--color-line`.

## Accessibility
header landmark; single h1; Breadcrumb nav labelled. Tabs inside header remain role=tablist.

## Light/dark
Token-driven.

## UNDESIGNED
- Narrow (1024-1279) wrapping of long actions. Proposal: actions stay on one row; the subtitle truncates; secondary actions move into a "More" Menu below 1100.

## Used by
DS-Navigation (Page structure). Settings-Team, Testing, Traces, Analytics, Knowledge, Tools.

## Differs from current web
New. Height is content-driven (no header-height token applies).
