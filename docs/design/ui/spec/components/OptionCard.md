# OptionCard
Purpose: selectable rich option (pick one or several) with lead tile, title, description and optional radio/checkbox. Also covers the Navigation "SourceTile" (knowledge-source chooser; deleted as a duplicate: `control: none`).
Not on DS-Actions or DS-Inputs v2; updated only for the designer's global rules. Merged from: DS-Display (OptionCard) and DS-Navigation (SourceTile).

## Anatomy
root (flex, gap `--space-12`, or `--space-10` for radio, radius `--radius-12`) > optional lead `NodeTile` (lg 34 at pad 16, md 28 at pad 12; SourceTile uses a neutral 34 tile: bg `--color-soft`, fg `--color-ink-secondary`) + text stack (title `--type-title`, description `--type-body-small` `--color-mute` with `--leading-relaxed`, gap `--space-3`) + optional control (`--size-checkbox` radio or checkbox).

## Variants
control: none (button `aria-pressed`; SourceTile 4-column grid, gap `--space-10`), check (button `aria-pressed`, lead tile), radio (label + radio, selected bg `--color-accent-light`), checkbox (label + checkbox at right).
Size (pad): 16 (`--space-16`), 12 (`--space-12`).

## States
- unselected: border `--border-width` `--color-line`, bg `--color-card`.
- selected: border `--border-width-strong` (2px) `--color-accent` plus a 4px soft halo (selection, not focus; needs a selection-halo token, see notes), padding reduced by 1 so the box does not shift; (SourceTile proposal: bg `--color-accent-light`).
- hover (proposal): border `--color-line-node`. focus-visible: outside ring with 2px gap (`--shadow-focus-ring`), distinct from the selected halo. disabled: global rule (0.45, not-allowed, no hover/focus).

## Props
```ts
enum OptionControl { None = 'none', Check = 'check', Radio = 'radio', Checkbox = 'checkbox' }
type OptionCardProps = {
  title: string; description: string | null; lead: ReactNode | null; selected: boolean; control: OptionControl; pad: 12 | 16; disabled: boolean; onSelect: () => void;
}
```

## Accessibility
none/check: `button` with `aria-pressed`; radio group: `radiogroup` with Radix `RadioGroup`; checkbox: Radix `Checkbox`. Whole card is clickable; single-choice groups use `role="radio"`.

## Light/dark
`--color-accent-light` selected tint needs the dark pair (in tokens.md).

## Used by
DS-Display, DS-Navigation WizardFrame Knowledge step (SourceTile), knowledge sources, channels, roles.

## Differs from existing
New; resembles `Card` but interactive. Radio and Checkbox come from their own specs.
