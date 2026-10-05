# Tabs
Purpose: underline tabs switching sibling views of one object, in `PageHeader` or at the top of a panel.
Source: DS-Actions v2 (Tabs, As a link). States: drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
tablist (`role="tablist"`, bottom border 1px `--color-line`, gap `--space-22`) > tabs (height 40, padding-x 0, bottom indicator). Tab panels are outside the design.

## Variants / sizes
- page: font 13 (`--type-body`), e.g. Overview / LLM cost / Custom charts.
- panel: font 12.5 (`--type-body-small`), e.g. Why it escalated / Contact.
Both height `--size-control-lg` (40).

## States (drawn on DS-States / DS-Dark-States)
- selected (`aria-selected="true"`): text `--color-ink`, weight 600, bottom border `--border-width-strong` (2px) `--color-accent`.
- default: text `--color-mute`, weight 400, indicator 2px transparent (no layout shift).
- hover (unselected): text `--color-ink` and the indicator previews in `--color-line-dash` (2px).
- focus-visible: outside ring `--shadow-focus-ring` (2px `--color-card` gap + 2px accent) with radius `--radius-4` on the tab, text `--color-ink`. (Changed: the previous spec drew it inset.)
- disabled: global rule on the single tab (0.45, not-allowed, no hover/focus); text stays `--color-mute`.
- with count (drawn): label + neutral `Badge` (bg `--color-soft`, text `--color-ink-secondary`, 11.5, padding 2 8, pill) after a `--space-6` gap.
Tab and selection indicators are both 2px (page: "Indicator is 2px everywhere").

## Props
```ts
enum TabsSize { Page = 'page', Panel = 'panel' }
type TabsProps<T extends string> = {
  tabs: { value: T; label: string; disabled: boolean; href: string | null; count: number | null }[]; value: T; onValueChange: (value: T) => void; size: TabsSize; ariaLabel: string | null;
}
```
Route-driven tabs render anchors with `role="tab"` and `aria-selected` (as drawn on the "As a link" sample); the look is identical.

## Accessibility
Radix `Tabs` fits (roving tabindex, arrows, Home/End, `aria-controls`). Link tabs: keep the roles from the page and add arrow-key navigation.

## Light/dark
Accent indicator in both themes; verify dark `--color-accent` on `--color-bg`.

## Used by
PageHeader tabs row, panel headers (Inspector, Inbox details), Simulator/Versions, Needs you/Live/Closed.

## Differs from existing
No Tabs in `shared/ui`.
