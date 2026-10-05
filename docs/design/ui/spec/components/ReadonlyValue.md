# ReadonlyValue
Purpose: input-framed display of a non-editable value, optionally with `VariableChip` tokens.
Source: DS-Inputs v2 (Read-only value).

## Anatomy
frame div > text with inline chips.

## Variants
sans (12.5, `--type-body-small`); mono (12, `--type-mono`) with chips (e.g. `/v1/bookings/{{event.output.booking_id}}`).

## Tokens
1px `--color-line`, radius `--radius-8`, bg `--color-card`, padding `--space-8` `--space-10`, line-height `--leading-relaxed`, `--color-ink`, `overflow-wrap: anywhere`.

## States
static; not focusable. Copy affordance, disabled: UNDESIGNED (proposal: a ghost IconButton `copy` sm at the right on hover/focus, now that the icon exists).

## Props
```ts
interface ReadonlyValueProps { children: ReactNode; mono: boolean }
```

## Accessibility
Plain element; if announced as a form value use `<output>` or `input readOnly`. No Radix.

## Light/dark
Token-driven.

## Used by
Inspector (resolved tool paths, descriptions).
