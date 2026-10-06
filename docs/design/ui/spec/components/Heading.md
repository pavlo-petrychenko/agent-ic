# Heading
Purpose: heading with a size scale decoupled from the HTML tag; use instead of hand-styled text.

## Sizes
DISPLAY 24/600 `--type-display`; H1 22/600 `--type-h1`; H2 18/600 `--type-h2`; H3 15/600 `--type-h3`. Letter-spacing `--tracking-tight` on display, H1, H2 (H3 none). Colour `--color-ink`. `nowrap` prop sets `white-space: nowrap` (H3 example: "Incoming message . Book 17:30").
Overline label (`--type-overline`, uppercase, `--tracking-overline`, `--color-accent-dark`) is the section label style; build as Text kind overline.

## Props
```ts
enum HeadingSize { Display = 'display', H1 = 'h1', H2 = 'h2', H3 = 'h3' }
type HeadingProps = { size: HeadingSize; as: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | null; nowrap: boolean; children: ReactNode }
```
Examples on the page: H1 as h1 ("Inbox"), H2 as h1 (auth "Log in"), H2 as h2, H3 as h2.

## States
Static; no links or interaction.

## Accessibility
Semantic level independent of size; one h1 per page. No Radix.

## Light/dark
`--color-ink` token.

## Differs from existing
No Heading component today.
