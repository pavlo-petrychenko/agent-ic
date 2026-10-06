# SegmentedControl
Purpose: compact joined single-choice toggle ("7 days / 30 days / 90 days", language, auth mode).
Source: DS-Actions v2 (Segmented control). Rebuilt from the page; Hover, focus and disabled are drawn on DS-States.

## Anatomy
group (`role="group"` + `aria-label`; inline-flex; align-self flex-start; 1px `--color-line`; radius `--radius-8`; overflow hidden; bg `--color-card`) > option buttons (no border, no radius, no dividers between options).

## Variants / sizes
- md: padding `--space-6` `--space-11`, font 12 (`--type-caption`). Drawn height about 31 (not on the 28 grid).
- sm: padding `--space-4` `--space-7`, font 11 (`--type-hint`), used for the language switch ("УКР / EN"). Drawn height about 25.
Both accept 2 to 4 options; long labels grow the option ("Signed (HMAC)"). UNDESIGNED: the 28 rule for small controls was not applied here; proposal: md fixed height `--size-control-sm` (28), sm 22 (`--size-control-xs`).

## States (drawn on DS-States / DS-Dark-States)
- selected (`aria-pressed="true"`): bg `--color-chip`, text `--color-ink`, weight 600.
- default: transparent, text `--color-mute`, weight 400.
- item hover (unselected only): bg `--color-soft`, text `--color-ink`.
- item focus-visible: inset ring `inset 0 0 0 2px --color-accent` on the option (`--shadow-focus-ring-inset`), text `--color-ink`; page: "Focus ring is drawn inset so the control's border does not clip it".
- disabled: drawn on the whole group: group at 0.45, not-allowed, no hover/focus. Per-option disabled uses the same rule (not drawn).
A value is always selected; clicking the selected option does nothing. DS-States still draws padding 6/11 at 12px (about 31 high); the 28 decision in INDEX section 7 is unchanged.

## Props
```ts
enum SegmentedControlSize { Sm = 'sm', Md = 'md' }
type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string; disabled: boolean }[]; value: T; onValueChange: (value: T) => void; size: SegmentedControlSize; ariaLabel: string; disabled: boolean;
}
```

## Accessibility
Radix `ToggleGroup` type="single" fits (roving focus, arrows); guard the empty value (`onValueChange('')`). The design uses `aria-pressed` buttons; add arrow-key navigation either way.

## Light/dark
Token-driven; selected `--color-chip`, idle `--color-mute`, border `--color-line` flip via tokens.

## Used by
Sidebar footer and AuthFrame footer (language), range pickers (7/30/90 days), auth-type pickers in the Inspector.

## Differs from existing
No SegmentedControl in `shared/ui`.
