# Input
Purpose: single-line text entry (page name `text_input`).
Source: DS-Inputs v2 (Text input). States: drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
native input only. A label is always supplied: visible via `Field`, or visually hidden (1px clip) with the accessible name kept.

## Variants / sizes
- md: height 34 (`--size-control-md`), radius `--radius-8`, padding-x `--space-12`, text 13 (`--type-body`).
- lg: height 40 (`--size-control-lg`), radius `--radius-10` (wizards, Composer).
- mono: JetBrains Mono 12.5 (`--type-mono-lg`) at md (paths, keys).
Other field-like controls (Select sm, SearchInput) follow the 28/34 height rule.

## States (all designed; hover and read-only drawn on DS-States)
- default: bg `--color-card`, 1px `--color-line`, text `--color-ink`, placeholder `--color-mute`.
- value: same.
- focus: border 1px `--color-accent` plus 3px soft halo (`--shadow-focus-field`). Fields only; everything else uses the outside ring.
- error (also drawn on DS-States): border 1px `--color-err`, no halo at rest; message under the field is Field's (11.5 `--color-err`). Focus on an error field: not drawn on DS-States; use tokens.md `--shadow-focus-field-error` (err border + `0 0 0 3px --color-err-light`).
- disabled: normal colours at 0.45 (bg stays `--color-card`), `cursor: not-allowed`, no hover/focus. No explicit soft background any more.
- hover (drawn on DS-States): border `--color-edge`.
- read-only (drawn on DS-States as "input · read-only"): not an input frame but `ReadonlyValue` (padding `--space-8` `--space-10`, mono 12, `--leading-relaxed`, 1px `--color-line`, bg `--color-card`), e.g. a masked secret.
Motion: `border-color`, `box-shadow` over `--duration-fast`.

## Props
```ts
enum InputSize { Md = 'md', Lg = 'lg' }
type InputProps = Omit<ComponentProps<'input'>, 'size'> & { size: InputSize; mono: boolean; invalid: boolean }
```

## Accessibility
Native input; name via `Field` (`htmlFor`) or `aria-label`; error via `aria-invalid` and `aria-describedby`. No Radix.

## Light/dark
Token-driven; dark halo value is the dark `--shadow-focus-field`.

## Used by
Field, Composer (lg), AuthFrame, wizard steps, SearchInput base, Inspector.

## Differs from existing `shared/ui/Input`
Existing: border-colour-only focus, `min-height`, no size/mono. Design: size, mono, 3px halo, fixed heights, 0.45 disabled.
