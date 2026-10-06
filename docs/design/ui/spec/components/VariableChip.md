# VariableChip
Purpose: inline highlighted variable reference such as `{{event.output.booking_id}}` (design name `var_token`).
Source: DS-Inputs v2 (Read-only value, Prompt editor).

## Tokens
bg `--color-accent-light`, text `--color-accent-dark`, radius `--radius-4`, padding 0 `--space-3`. Font and size are inherited from the host: 13 sans in PromptEditor, 12 mono in a mono ReadonlyValue; the chip does not set its own family.
A half-typed token (`{{contact.`) is highlighted the same way while the variable menu is open.

## Props
```ts
interface VariableChipProps { path: string }
```
Renders the literal `{{path}}`.

## Accessibility
Plain span; literal text stays selectable and copyable. In PromptEditor it is part of the editable text, not a separate focus stop.

## States
Static: no hover, focus, disabled. Removal is by text editing (UNDESIGNED: no per-chip delete affordance; proposal: none).

## Light/dark
Token-driven (accent-light and accent-dark have dark values).

## Used by
ReadonlyValue, PromptEditor, Inspector.
