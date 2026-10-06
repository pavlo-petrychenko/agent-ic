# Radio
Purpose: single choice within a group (e.g. Pin v4 / Follow latest).
Source: DS-Inputs v2 (Radio). States: drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
label (inline-flex, centre, gap `--space-6`) > 16px circle (`--size-checkbox`) + text (12.5, `--color-ink-secondary`). The page uses a native radio with `accent-color`; implementation draws border `--color-line-dash`, selected dot `--color-accent`.

## States (drawn on DS-States / DS-Dark-States unless marked)
- unchecked: 16 circle, bg `--color-card`, border 1.5px solid `--color-line-dash`.
- unchecked hover: border `--color-edge`.
- checked: border 2px `--color-accent`, bg `--color-card`, centred dot 8px `--color-accent`.
- focus-visible: outside ring `--shadow-focus-ring` around the circle.
- disabled: global rule (0.45, not-allowed, no hover/focus), drawn on an unchecked radio.
- error: UNDESIGNED (proposal: border `--color-err`).
Hit area is the whole label row.

## Props
```ts
interface RadioGroupProps { name: string; value: string | null; onValueChange: (v: string) => void; options: { value: string; label: string; disabled: boolean }[]; orientation: 'horizontal' | 'vertical'; ariaLabel: string }
```
Page shows a horizontal group, gap `--space-20`.

## Accessibility
`radiogroup` with roving arrow keys; Radix `RadioGroup` fits. Native radios acceptable.

## Light/dark
Token-driven.

## Used by
Version pinning, OptionCard radio control.
