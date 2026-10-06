# AuthFrame
Purpose: centred layout for logged-out pages (sign up, log in, workspace setup, invite).

## Anatomy
div(min-height 100vh, centre) > brand row (logo mark 28 + product name 15/600) | content slot (usually a Card) | footer row (Terms, Privacy, language SegmentedControl).

## Variants
- width: `md` 400 (page sample: Log in) | `lg` 460 (`--size-auth-card-md` / `--size-auth-card-lg`). Replaces the repo `--layout-form-width` 448.
- Which pages use lg is not stated: proposal lg for multi-field or two-column content (workspace setup, sign up with several fields), md for log in and invite.

## States
Static; contained inputs and buttons own states. Standalone footer links: underline on hover only.

## Props
```ts
enum AuthCardSize { Md = 'md', Lg = 'lg' }
interface AuthFrameProps { size: AuthCardSize; children: ReactNode; footer: ReactNode }
```

## Tokens
bg `--color-bg`; gap `--space-24`; card bg `--color-card`, border `--color-line`, radius `--radius-12`, padding `--space-28`, gap `--space-18`; title `--type-h2`; subtitle `--type-caption` `--color-mute`; footer links `--type-caption` `--color-mute`, gap `--space-16`; logo mark radius `--radius-8` bg `--color-accent`; input height 34 (md); primary button 40 (`Button` lg, full width, `--type-button-lg`, `--size-control-lg`). Language switch: SegmentedControl xs (padding 4 7, 11px).

## Accessibility
main landmark; h1 is the card title; use visible labels (the hidden-label pattern on the page is only for the sample).

## Light/dark
Token-driven. Applies theme from the system setting before login (no stored user): follow prefers-color-scheme.

## Used by
DS-Navigation (Logged-out pages). All MVP-Auth-* pages, MVP-NoAccess.

## Differs from current web
Current Card/Field/Input cover the card; the Auth layout is new. Width 400/460 vs `--layout-form-width` 448.
