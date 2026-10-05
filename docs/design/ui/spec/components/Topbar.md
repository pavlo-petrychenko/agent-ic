# Topbar
Purpose: 56px editor bar with breadcrumb trail, status pill and primary actions (agent editor / flow builder).

## Anatomy
header > left [Breadcrumb(topbar) + Badge with dot] | right [secondary Button + primary Button].

## Variants
Single. Shown with the Rail (flow builder) and on the editor page.

## States
Static; pill tone per status (draft shown: warn, text "Draft · edited from v6"). Buttons own states (disabled: global rule).

## Props
```ts
interface TopbarProps { breadcrumbs: BreadcrumbProps['items']; status: ReactNode; actions: ReactNode }
```

## Tokens
height 56 (`--size-topbar-height`); padding 0 `--space-16` 0 `--space-20`; bg `--color-panel`; border-bottom `--color-line`; z `--z-nav`; left gap `--space-14`; actions gap `--space-10`; buttons md 34 (Versions secondary, Publish primary).

## Accessibility
header landmark; actions are real buttons; the status pill carries text, not colour only.

## Light/dark
Token-driven; pill uses `--color-warn` / `--color-warn-light`.

## Used by
DS-Navigation (Page structure). Flow builder and agent editor screens. Inspector drawer (compact) opens beneath it.

## Differs from current web
New; Design height is `--size-topbar-height` (56); the repo header is 48.

## Notes
The Badge dot on this page is drawn in the pill's text colour (#6B4A00), not the brighter `--color-warn-dot` that the Foundations dot rule prescribes: Badge scope should settle (spec here follows the rule).
