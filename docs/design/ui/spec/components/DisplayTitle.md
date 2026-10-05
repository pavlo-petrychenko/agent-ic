# DisplayTitle
Purpose: large lead title with a supporting sentence for wizard steps and onboarding screens.

## Anatomy
div > h1 + p.

## Props
```ts
type DisplayTitleProps = { title: string; subtitle: string | null }
```

## Tokens
Gap `--space-6`; title `--type-display` (24/600, `--tracking-tight`, `--color-ink`); subtitle `--type-lead` (14) `--color-mute`, max-width `--layout-lead-width` (620 in tokens.md; the Display page lead sample uses 760, so treat 620 as a proposal and keep one value; listed in open questions).

## States
Static.

## Accessibility
Renders the page h1.

## Light/dark
Token-driven.

## Used by
WizardFrame content, onboarding.
