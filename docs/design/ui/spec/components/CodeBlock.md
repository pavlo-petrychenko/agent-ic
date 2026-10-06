# CodeBlock
Purpose: preformatted code or JSON; light (inline-ish) or dark surface.

## Variants
- light: padding 12, radius `--radius-8`, bg `--color-card`, border `--color-line`, `--type-mono-sm`, text `--color-ink-secondary`, `--leading-relaxed`, `pre-wrap` + `overflow-wrap: anywhere`. Follows the theme.
- dark: padding 14px 16px, radius `--radius-12`, bg `--color-code-bg`, text `--color-code-fg`, `--type-mono-lg`, `--leading-relaxed`, `white-space: pre`. Stays dark in both themes (in dark theme `--color-code-bg` is deeper than the page).

## States
Static. As drawn dark clips (`overflow: hidden`); build with `overflow: auto` and keyboard focus (UNDESIGNED: scrollbar styling; proposal: native thin scrollbar). Focus ring when focusable: outside, 2px gap.
UNDESIGNED: copy button. Proposal: ghost IconButton xs (copy icon) top-right.

## Props
```ts
enum CodeTone { Light = 'light', Dark = 'dark' }
type CodeBlockProps = { code: string; tone: CodeTone; wrap: boolean; language: string | null }
```

## Accessibility
`pre > code`; `tabIndex 0` when scrollable. No Radix.

## Used by
Tool input/output, API responses.
