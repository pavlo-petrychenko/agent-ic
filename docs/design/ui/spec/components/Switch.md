# Switch
Purpose: immediate on/off setting with inline label (page name: Toggle).
Source: DS-Inputs v2 (Toggle). Rebuilt; NEEDS-VERIFY cleared. States: drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
label (flex, `justify-content: space-between`, gap `--space-10`, label text 12.5 `--color-ink` on the left) > track (`--size-switch-width` x `--size-switch-height` = 34x20, `--radius-pill`) > thumb (`--size-switch-thumb` 16 circle, `--color-card` (#FFFFFF light, #211F1C dark; drawn on DS-Dark-Inputs), offset 2px, travels to left 16px when on). Visually hidden `input role="switch"` provides semantics. Width of the row is set by the parent (260 in samples).

## States (drawn on DS-States / DS-Dark-States)
- off: track `--color-line-dash` (dark #4A463F), thumb `--color-card`.
- off hover: track `--color-edge`.
- on: track `--color-accent` (dark #4DB6AE), thumb `--color-card` (left 16).
- on hover: track `--color-accent-dark`.
- focus-visible: outside ring `--shadow-focus-ring` around the track.
- disabled: same colours at 0.45 on the track (drawn on the on state), `cursor: not-allowed`, no hover/focus. The old `--color-mute` disabled track is gone.
Hit area is the whole label row (DS-States note).
Motion: thumb `transform` and track colour over `--duration-fast`.

## Props
```ts
type SwitchProps = { checked: boolean; onCheckedChange: (checked: boolean) => void; label: string | null; disabled: boolean }
```

## Accessibility
Radix `Switch` (role=switch, Space, `aria-checked`); label via `htmlFor` or wrapping label. `label: null` requires `aria-label`.

## Light/dark
Token-driven, drawn on DS-Dark-Inputs: thumb is `--color-card` in both themes (dark #211F1C on the #4DB6AE on-track and the #4A463F off-track); it does not stay light. Disabled = same colours at .45.

## Used by
Inspector node properties, settings, channel options.
