# IconButton
Purpose: square icon-only action (close, collapse, add, more, send, toolbar), always named by `aria-label`.
Source: DS-Actions v2 (Icon button, As a link). States: ghost hover and disabled reused on DS-States (Table row menu, ListGroup add, Dialog close, Search clear).

## Anatomy
square button, centred `Icon` (stroke 1.5, `currentColor`): sm 14px, md 15px, lg 16px. Sample glyphs: `more`, `plus`, `send`, `chevron-right`.

## Variants
- ghost: transparent, icon `--color-mute`, no border. Hover bg `--color-soft`, icon `--color-ink`.
- secondary: bg `--color-card`, 1px `--color-line`, icon `--color-ink`. Hover bg `--color-soft`.
- primary: bg `--color-accent`, icon `--color-on-accent`. Hover bg `--color-accent-dark`.
No danger variant is designed (UNDESIGNED; proposal: reuse Button danger colours).

## Sizes
xs 22 (`--size-control-xs`, ghost only, icon 14: the Search clear button drawn on DS-States), sm 28 (`--size-control-sm`), md 34 (`--size-control-md`), lg 40 (`--size-control-lg`); square; radius `--radius-8`.

## States
hover (above); focus-visible: outside ring, 2px gap (`--shadow-focus-ring`); disabled: normal colours at 0.45, `cursor: not-allowed`, no hover/focus (global rule). Ghost hover drawn on DS-States: bg `--color-soft`, icon `--color-ink`. Loading drawn only for Composer send: the icon is replaced by `spinner` (same size), colours kept, no dimming. Active: UNDESIGNED (proposal: as Button, ghost/secondary bg `--color-chip`, primary `--color-accent-dark`).

## Props
```ts
enum IconButtonVariant { Ghost = 'ghost', Secondary = 'secondary', Primary = 'primary' }
enum IconButtonSize { Xs = 'xs', Sm = 'sm', Md = 'md', Lg = 'lg' }
type IconButtonProps = Omit<ComponentProps<'button'>, 'aria-label' | 'children'> & {
  icon: IconName; label: string; variant: IconButtonVariant; size: IconButtonSize; href: string | null; loading: boolean;
}
```
`label` becomes the required `aria-label`. `href` renders an anchor (page "As a link": ghost/secondary/primary at sm and md).

## Accessibility
Native button or anchor, mandatory accessible name. Optional `Tooltip` for the label (not drawn). No Radix.

## Light/dark
Token-driven.

## Used by
Sidebar collapse, SecondaryNav/ListGroup add, Inspector close, Dialog close, FileRow remove, ZoomControl, Composer send (lg primary), Table row menu.

## Differs from existing
No IconButton in `shared/ui`; implement beside Button sharing a style mixin.
