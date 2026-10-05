# Stepper
Purpose: horizontal step progress for wizards.

## Anatomy
`ol[aria-label]` > `li` (marker `--size-step-circle` 26 + label, gap `--space-8`) with connector `li` (48 x 1, `--color-line`, aria-hidden) between; item gap `--space-12`.

## Variants / states (per step)
- done: marker bg `--color-accent`, `check` icon 14 `--color-on-accent`; label `--color-ink`, weight 400.
- current: marker border 2px (`--border-width-strong`, the indicator width) `--color-accent`, number 12/700 `--color-accent-dark`; label `--color-ink`, weight 600.
- upcoming: marker border `--border-width` `--color-line-dash`, number 12 `--color-mute`; label `--color-mute`.
Static, not interactive in the design (no hover, no focus; the disabled rule does not apply). Going back to a done step is done with the footer Back button.

## Props
```ts
enum StepState { Done = 'done', Current = 'current', Upcoming = 'upcoming' }
type StepperProps = { steps: { id: string; label: string }[]; current: number; ariaLabel: string }
```

## Accessibility
`ol/li`; `aria-current="step"` on current; done steps get visually hidden "completed". No Radix.

## Light/dark
Token-driven; on-accent check turns dark on the lighter dark-theme teal.

## UNDESIGNED
- Narrow behaviour (1024-1279): the page draws the full 4-step row only. Proposal: no change; the row is about 600 wide and fits at 1024.

## Used by
WizardFrame; DS-Navigation. Traces and Traces-Timeline step lists may reuse the markers.

## Differs from existing
New.
