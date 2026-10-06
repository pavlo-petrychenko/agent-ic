# Button
Purpose: action trigger (submit, confirm, cancel, destructive action, inline text action).
Source: DS-Actions v2 (Buttons, Button states, With icon / full width, As a link). Rebuilt from the page. Active and loading are now drawn on DS-States.

## Anatomy
button (inline-flex, centred, gap `--space-6`, nowrap) > optional leading `Icon` (13px; 14px on the lg sample, stroke 1.5) > label. Icon-only is `IconButton`. Navigating buttons render as `<a>` with identical look (prop `href`); text links are `TextLink`.

## Variants
| variant | bg | border | text | hover |
|---|---|---|---|---|
| primary | `--color-accent` | none | `--color-on-accent`, 600 | bg `--color-accent-dark` |
| secondary (default) | `--color-card` | 1px `--color-line` | `--color-ink` | bg `--color-soft` |
| danger (outlined) | `--color-card` | 1px `--color-err-line` | `--color-err` | bg `--color-err-light` |
| ghost (inline text action) | transparent | none, padding 0 | `--color-accent`, 600 | text `--color-accent-dark` plus underline |
Ghost is always 22 high, radius `--radius-4`, no sizes; label `--type-body-small-strong` (12.5/600). Only primary labels are shown at 600 on the page; secondary and danger labels render at the default weight (400) in the sample markup. UNDESIGNED: confirm secondary/danger weight (proposal: 600 like primary, `--type-title`-style weight, for consistency).

## Sizes
| size | height | padding-x | font |
|---|---|---|---|
| sm | 28 (`--size-control-sm`; was 30, now 28) | `--space-10` | 12 (`--type-caption`) |
| md (default) | 34 (`--size-control-md`) | `--space-12` | 13 (`--type-body`) |
| lg | 40 (`--size-control-lg`) | `--space-16` | 13.5 (`--type-button-lg`) |
| ghost | 22 (`--size-control-xs`) | 0 | 12.5 |
Radius `--radius-8`. `fullWidth` sets width 100% (shown at md and lg). The 30px `--size-control-compact` no longer applies to Button.

## States (designed; drawn on DS-States / DS-Dark-States)
- hover: per variant table.
- active (pressed), drawn on DS-States ("Active (pressed) = hover colour; secondary uses chip"): primary bg `--color-accent-dark`; secondary bg `--color-chip`; danger bg `--color-err-light`; ghost text `--color-accent-dark` without underline. No transform, no scale.
- focus-visible: `--shadow-focus-ring` = `0 0 0 2px --color-card, 0 0 0 4px --color-accent` (dark page: the gap is dark `--color-card` #211F1C). Ghost ring uses radius `--radius-4`.
- loading, drawn on DS-States: `spinner` icon 13px (stroke 1.8) in a wrapper at opacity .9, placed before the label (it replaces the leading icon when there is one); label and width are kept; variant colours unchanged (no dimming); `cursor: progress`; clicks blocked; `aria-busy="true"`. Ghost draws no loading look (its loading cell equals default): `loading` is not offered on ghost.
- disabled (one global rule): normal variant colours at `--opacity-disabled` (0.45), `cursor: not-allowed`, no hover, no focus, `pointer-events: none`.
DS-States still renders secondary and danger labels at 400 (weight question above stays open).
Motion: `background-color`, `border-color`, `color` over `--duration-fast`.

## Props
```ts
enum ButtonVariant { Primary = 'primary', Secondary = 'secondary', Danger = 'danger', Ghost = 'ghost' }
enum ButtonSize { Sm = 'sm', Md = 'md', Lg = 'lg' }
type ButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
  variant: ButtonVariant; size: ButtonSize; loading: boolean; icon: IconName | null; fullWidth: boolean; href: string | null; children: ReactNode;
}
```
Ghost ignores `size`. With `href` the router `Link` is rendered.

## Accessibility
Native `button`, `type="button"` default; `disabled` attribute; loading keeps the label for AT. Link form is a real anchor. No Radix.

## Light/dark
Token-driven; every colour above has a dark value in tokens.md (primary text turns dark via `--color-on-accent`). Designer: all 18 step colours and shadows have dark values; no per-component dark art needed.

## Used by
Topbar, WizardFrame footer, AuthFrame CTA (lg, full), PaneBar, Callout action, CardHeader, Dialog footer, field actions, Inspector.

## Differs from existing `shared/ui/actions/Button`
Existing: sm 28 / md 34, padded ghost, solid danger, opacity .55 disabled. Design: add lg and 22px text ghost, outlined danger, 0.45 disabled, `--shadow-focus-ring`, loading (spinner before label, width kept, `cursor: progress`), active colours (primary/danger = hover, secondary = chip), `href`.
