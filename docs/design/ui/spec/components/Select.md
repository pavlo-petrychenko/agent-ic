# Select
Purpose: native single-choice dropdown.
Source: DS-Inputs v2 (Select). Hover, error and disabled for the select trigger drawn on DS-States (as the "Select / select button" row).

## Anatomy
optional visible label (12, `--color-mute`, gap `--space-4` above) + select box with native chevron.

## Sizes
- md: height 34, text 12.5 (`--type-body-small`).
- sm: height 28 (`--size-control-sm`; was 30), text 12 (`--type-caption`).
Frame: 1px `--color-line`, radius `--radius-8`, bg `--color-card`, padding-x `--space-8`, text `--color-ink`.

## States
default (designed). hover: border `--color-edge` (drawn on DS-States). focus: border `--color-accent` + `--shadow-focus-field`. error (drawn): border `--color-err`, no halo; message 11.5 (`--type-small`) `--color-err` under the control, gap `--space-6` ("Pick an agent"). disabled (drawn): the wrapper at 0.45, not-allowed. Open state is the native popup (the custom drawn listbox belongs to SelectButton).

## Props
```ts
enum SelectSize { Md = 'md', Sm = 'sm' }
interface SelectOption { value: string; label: string; disabled: boolean }
interface SelectProps extends Omit<ComponentProps<'select'>, 'size'> { size: SelectSize; options: SelectOption[]; invalid: boolean; error: string | null }
```

## Accessibility
Native select; label via hidden `label`, visible label, or `Field`. Radix Select only if options need rich content (use SelectButton).

## Light/dark
Token-driven; set `color-scheme` per theme so the native popup follows.
