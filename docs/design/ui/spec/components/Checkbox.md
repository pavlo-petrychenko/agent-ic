# Checkbox
Purpose: boolean choice with inline label.
Source: DS-Inputs v2 (Checkbox). Rebuilt; Hover and indeterminate are drawn on DS-States; error is still UNDESIGNED.

## Anatomy
label (inline-flex, align centre, gap `--space-8`) > box `--size-checkbox` (16) + text (12.5, `--color-ink`). The page uses a native checkbox with `accent-color`; implementation draws its own box (radius `--radius-4`) so the tick uses `--color-on-accent` in both themes.

## Variants
- with label (inline).
- no label (table cell): `aria-label` required, e.g. "View agents".
- align top: box offset 2px from the top, label is a stack of title (12, `--color-ink`) and caption (12, `--color-mute`, gap `--space-2`), e.g. "message.received / A customer sent a message".

## States (drawn on DS-States / DS-Dark-States unless marked)
- unchecked: bg `--color-card`, border 1.5px solid `--color-line-dash`, radius `--radius-4`, box 16 (`box-sizing: border-box`).
- unchecked hover: border `--color-edge`.
- checked: bg and border `--color-accent`; `check` icon 11px, stroke 2.2, colour `--color-on-accent` (#FFFFFF light, #0B1F1D dark).
- indeterminate (`mixed`): as checked, with a `minus` icon 11px, stroke 2.2, `--color-on-accent`.
- focus-visible: outside ring `--shadow-focus-ring` around the box.
- disabled: normal colours at 0.45, `cursor: not-allowed`, no hover/focus (drawn on a checked box).
- error: UNDESIGNED (not on DS-States). Proposal: border `--color-err`.
Hit area is the whole label row (page note). DS-Patterns > Table draws the same unchecked, checked and indeterminate boxes (16, 1.5px, radius 4, icons 11 stroke 2.2) in the header select-all and rows: consistent.

## Props
```ts
type CheckboxProps = {
  checked: boolean | 'indeterminate'; onCheckedChange: (checked: boolean) => void; label: ReactNode | null; align: 'center' | 'top'; disabled: boolean; invalid: boolean;
}
```
`label: null` requires `aria-label`.

## Accessibility
Radix `Checkbox` (role=checkbox, Space, indeterminate). Label association required; clicking the label toggles. Radix stays in `shared/ui`.

## Light/dark
Token-driven.

## Used by
OptionCard checkbox control, permission matrices, Table selection, event pickers.
