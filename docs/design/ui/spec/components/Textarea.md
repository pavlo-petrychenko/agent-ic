# Textarea
Purpose: multi-line plain text entry.
Source: DS-Inputs v2 (Textarea).

## Anatomy
native textarea; hidden label or `Field` label.

## Tokens
- frame: 1px `--color-line`, radius `--radius-8`, bg `--color-card`, padding `--space-8` `--space-12`, width 100%.
- text: 13 (`--type-body`), line-height `--leading-relaxed` (1.45), `--color-ink`.
- min-height 72 (local constant); `resize: none` (design); height settable (`rows_h`).

## States
default, focus (border `--color-accent` + `--shadow-focus-field` 3px halo; designed). error, disabled: same rules as Input (disabled = 0.45, not-allowed; error + focus = `--shadow-focus-field-error`). hover: border `--color-edge`, the field hover drawn on DS-States for Input, Select, SelectButton and SearchInput (Textarea itself is not drawn there; applied by the field rule).

## Props
```ts
interface TextareaProps extends ComponentProps<'textarea'> { invalid: boolean; mono: boolean }
```
`mono` is a proposal (UNDESIGNED on the page).

## Accessibility
Native textarea; label required; `aria-invalid`, `aria-describedby` via Field. No Radix.

## Light/dark
Token-driven.
