# Field
Purpose: form wrapper pairing a label, a control, and a hint or error message.
Source: DS-Inputs v2 (Field).

## Anatomy
column, gap `--space-5`: label (12, `--type-caption`, `--color-mute`) > control > hint or error (11.5, `--type-small`). Select's own visible label uses gap `--space-4`.

## Variants / states
- label + control; with hint (`--color-mute`, "Always runs the published version."); with error (`--color-err`, "Passwords don’t match"; replaces the hint; control gets the err border).
- required marker, disabled: UNDESIGNED. Proposal: required adds " *" in `--color-err` with a visually hidden "required"; disabled passes through to the control (global 0.45 rule applies to the control, label stays full strength).

## Props
```ts
interface FieldProps { label: string; hint: string | null; error: string | null; children: (control: { id: string; 'aria-describedby': string | null; invalid: boolean }) => ReactNode }
```

## Accessibility
label `htmlFor` = control id; hint/error ids feed `aria-describedby`; error is `role="alert"` or live polite; `aria-invalid` on the control. No Radix.

## Light/dark
Token-driven.

## Differs from existing
Existing label is `--type-title` ink; design is 12 mute caption, hint/error 11.5, gap `--space-5`; error text `--color-err` and the control's error halo `--color-err-light` (`--shadow-focus-field-error`). Existing render-prop API stays.
