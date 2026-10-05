# NavSectionLabel
Purpose: uppercase group heading inside Sidebar and SecondaryNav.

## Anatomy
div > span (+ optional trailing IconButton ghost 28 in SecondaryNav, row min-height 22).

## Variants
- withAction: boolean (SecondaryNav shows "+" to create)

## States
Static. Trailing button is an IconButton ghost (hover `--color-soft`, ring `--shadow-focus-ring`, disabled global rule).

## Props
```ts
interface NavSectionLabelProps { label: string; action: { label: string; onClick: () => void; icon: ReactNode } | null }
```

## Tokens
font `--type-overline` (11/600), uppercase, letter-spacing `--tracking-overline` (.06em); color `--color-mute`; padding 0 `--space-10` `--space-4`; action 28 (`--size-control-sm`), icon `plus` 14.

## Accessibility
Heading-like text; use h2/h3 or aria-labelledby on the group list. Action button has aria-label ("New tool").

## Light/dark
Token-driven.

## Used by
Sidebar (Build, Operate), SecondaryNav (Tools, API connections).

## Differs from current web
New. `--type-overline` exists.
