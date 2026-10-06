# SelectButton
Purpose: button-styled picker trigger showing a value plus context, opening a richer popover than a native select.
Source: DS-Inputs v2 (Select button). Open listbox drawn on DS-States.

## Anatomy
button (flex, space-between, gap `--space-8`, width 100%, height 34, padding-x `--space-10`, 1px `--color-line`, radius `--radius-8`, bg `--color-card`) > left group (optional lead tile, value) + right group (context text, `chevron-down` 12px `--color-mute`, gap `--space-4`).

## Variants
- value + context: lead `NodeTile` 22 (radius `--radius-6`, hue `api`, `api` icon 13px), value "Salon CRM" 13 (`--type-body`), context mono 11 (`--type-mono-xs`, `--color-mute`).
- mono value: "CRM_TOKEN" in 12 mono (`--type-mono`), context sans 12 `--color-mute` ("from Secrets vault").
- short: value only ("GET", width 90) plus chevron.
- label inside (drawn on DS-States): left group = field label 12 (`--type-caption`, `--color-mute`) then value 13 `--color-ink`, gap `--space-8`; right = `chevron-down` 12 `--color-mute` ("Agent  Salon assistant", width 200).
Size: md (34) only (sm: see States).

## States (drawn on DS-States / DS-Dark-States)
- default: 1px `--color-line`.
- hover: border `--color-edge`.
- focus-visible: border `--color-accent` + `--shadow-focus-field` (3px `--color-accent-glow`).
- open: same frame as focus; the chevron stays `chevron-down` (no rotation). Listbox 4px below (`--space-4`), width = trigger width (200 in the sample, not `--size-menu-width`), bg `--color-card`, 1px `--color-line`, radius `--radius-10`, `--shadow-popover`, padding `--space-6`, gap `--space-2`. Option: padding `--space-7` `--space-8`, radius `--radius-6`, gap `--space-10`, lead NodeTile 18 (radius `--radius-6`, icon 11) + label 12.5, trailing slot 11 `--color-mute` (hint "draft"); selected option bg `--color-accent-light` + trailing `check` 13px, stroke 2, `--color-accent`.
- error: border `--color-err`, no halo; message 11.5 `--color-err` under the control (gap `--space-6`).
- disabled: wrapper at 0.45, not-allowed, no hover/focus.
sm (28): still UNDESIGNED; proposal unchanged (height 28, padding-x `--space-8`, text 12).

## Props
```ts
interface SelectButtonProps { value: string; context: string | null; label: string | null; invalid: boolean; icon: ReactNode | null; mono: boolean; open: boolean; disabled: boolean; onClick: () => void }
```

## Accessibility
`aria-haspopup="listbox"`, `aria-expanded`; name = value + context. Radix Popover for the picker.

## Light/dark
Token-driven.

## Used by
Inspector pickers (connection, secret, HTTP method).
