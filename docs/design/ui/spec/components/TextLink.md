# TextLink
Purpose: navigate somewhere. In-place actions use a ghost `Button`.
Source: DS-Actions v2 (Text link); underline rule from the designer. Existing `shared/ui/Link` (TanStack Router `createLink`) gets this spec.

## Anatomy
anchor with text.

## Variants
- tone accent: `--color-accent`; hover `--color-accent-dark`.
- tone error: `--color-err-ink` (sample "Reconnect"); hover UNDESIGNED (proposal: underline only).
- placement standalone (default): font 12 / 600 (`--type-caption-strong`), underlined on hover only. The page markup shows `text-decoration: none` at rest.
- placement inline (link inside a sentence): always underlined.

## States
hover: colour change plus underline (standalone). focus-visible: outside ring, 2px gap, radius `--radius-4`. disabled: global rule (rarely used). visited: not styled.

## Props
```ts
enum LinkTone { Accent = 'accent', Error = 'error' }
type LinkProps = RouterLinkProps & { tone: LinkTone; inline: boolean }
```

## Accessibility
Native anchor; external links get `rel="noopener noreferrer"` and an accessible hint. Underline is the non-colour cue inside text, hence always on there. No Radix.

## Light/dark
Token-driven.

## Differs from existing
`shared/ui/Link` (TanStack Router `createLink`) exists with an accent colour. Add `tone` (error uses `--color-err-ink`), `--type-caption-strong`, and the underline rule: standalone links underline on hover only, inline links always (new `inline` prop); focus ring outside with 2px gap.
