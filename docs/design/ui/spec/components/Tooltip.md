# Tooltip
Purpose: short hover/focus hint (rail items, chart points, disabled-reason) and the transient "Copied" confirmation.
Source (states): drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
bubble `role="tooltip"`: text with optional strong lead ("<strong>Label</strong> · value") + arrow (drawn on DS-States): 8x8 square in `--color-tooltip-bg`, rotated 45°, centred on the edge facing the trigger, offset -4px. The Rail and chart tooltips are drawn without an arrow (ChartTooltip keeps none).

## Variants
side: top (default), right (Rail), bottom, left, all four drawn on DS-States; flips when there is no room. "Copied" is drawn as a bare bubble. Multi-line (drawn): max-width 240, `white-space: normal`, line-height `--leading-relaxed` (1.45).

## States (drawn on DS-States / DS-Dark-States)
open/closed. Offset 8px from the trigger. Opens after 400ms on hover or focus (replaces the 300ms proposal); hides on blur, Escape or pointer leave after 100ms. Fade `--duration-base` (200) `--ease-enter` (not on the page; kept). Never put actions inside a tooltip. A Tooltip explains why a control is disabled (disabled rule); a disabled control stays focusable via a wrapper so the tip can show. Dark page: bubble and arrow `--color-tooltip-bg` #ECE8E1, text #1A1816, shadow `0 4px 12px rgba(0,0,0,.5)`.

## Tokens
bg `--color-tooltip-bg` (light #1F1D1A, dark #ECE8E1: inverts to a light bubble in dark), text `--color-tooltip-fg` (#FFFFFF light, #1A1816 dark), padding `--space-5` `--space-9` (5 9), radius `--radius-8`, font `--type-caption` (12), nowrap (multi-line variant wraps at 240), shadow `--shadow-tooltip` (dark 0 4px 12px .5), z `--z-tooltip` (600, above everything).

## Props
```ts
enum TooltipSide { Top = 'top', Right = 'right', Bottom = 'bottom', Left = 'left' }
type TooltipProps = { content: ReactNode; side: TooltipSide; arrow: boolean; children: ReactElement }
```

## Accessibility
Radix `Tooltip` (`aria-describedby`, shows on focus, Escape closes). Never the only route to essential info. "Copied" also announces through a `role="status"` live region. Reduced motion: opacity only.

## Light/dark
Inverted in both themes: dark bubble on light, light bubble on dark (designed).

## Used by
Rail items, charts (via `ChartTooltip`), icon-only controls, disabled controls; DS-Navigation, DS-Data, DS-Display.

## Differs from existing
No Tooltip in `shared/ui`.
