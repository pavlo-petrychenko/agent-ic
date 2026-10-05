# Toast
Purpose: floating, transient confirmation or error message. A `Toast` exists in the repo `shared/ui`.
Status: designed, drawn on DS-Patterns > Feedback > Toast (light) and DS-Dark-Patterns (dark). It was UNDESIGNED in v2; the old proposal is replaced.

## Design (drawn on DS-Patterns)
- Anatomy: surface (flex, align centre, gap `--space-10`, padding `--space-10` `--space-12`, width 360, bg `--color-card`, border `--border-width` `--color-line`, radius `--radius-10`, shadow `--shadow-popover`) > tone icon 16 (stroke 1.5, no tile) + message (`--type-body` 13/400, `--color-ink`, flex-grow 1) + optional action (text button: height 22 `--size-control-xs`, padding 0, `--type-body-small-strong` 12.5/600, `--color-accent`, gap `--space-6`) + dismiss IconButton sm ghost (28, radius `--radius-8`, transparent, icon `x` 14, `--color-mute`, aria-label "Dismiss"). One line, no title. The surface is the same for every tone: no tone fill, no tone border; only the icon colour changes.
- Tones as drawn: success: `check` in `--color-ok-dot` ("v4 is live on Telegram and API", no action). Info / undo: `info` in `--color-accent` with action "Undo" ("Deleted 2 steps"). Error: `alert` in `--color-err` with action "Retry" ("Couldn’t save the draft").
- Position (drawn rule): bottom-left of the viewport, 16px (`--space-16`) from the bottom and left edges; stacked newest on top; at most 3 visible. Stack gap: not stated (proposal `--space-8`); a 4th toast removes the oldest (proposal).
- Timing (drawn rule): success hides after 4000ms; a toast with an action hides after 8000ms; errors stay until dismissed. The timer pauses on hover (proposal: also while focus is inside the toast).
- Motion: not drawn. Use the tokens: enter `--duration-slow` (320) `--ease-enter`, exit about 256ms `--ease-exit` (proposal: fade plus 8px rise); reduced motion: opacity only, at most 120ms.
- Component-local constants (`Toast.constants.ts`): `TOAST_WIDTH = 360`, `TOAST_MAX_VISIBLE = 3`, `TOAST_OFFSET = 16`, `TOAST_DURATION_MS = 4000`, `TOAST_WITH_ACTION_DURATION_MS = 8000`; errors use `null` (sticky).

## States
Action and dismiss are standalone controls: focus ring outside with 2px gap (`--shadow-focus-ring`); dismiss hover `--color-soft` (Foundations hover rule, not drawn); action hover underline (standalone link rule). Disabled does not apply.

## Props
```ts
enum ToastTone { Info = 'info', Ok = 'ok', Err = 'err' }
type ToastProps = { tone: ToastTone; message: string; action: { label: string; onClick: () => void } | null; durationMs: number | null; dismissLabel: string }
```
`durationMs` defaults by rule: ok or info without action 4000, any toast with an action 8000, err `null` (stays until dismissed).

## Accessibility
Radix `Toast` (inside `shared/ui`): `role="status"` (ok/info), `role="alert"` (err); never the only way to learn of a failure. The Toast viewport sits bottom-left; Radix hotkey (F8) moves focus to it. An "Undo" toast must have a keyboard equivalent (canvas: ⌘Z, DS-Patterns > Canvas interactions > Keyboard: "Delete removes the selection (with undo toast)").

## Light/dark
Drawn on DS-Dark-Patterns: surface `--color-card` #211F1C, border `--color-line` #34312C, shadow `--shadow-popover` 0 12px 32px rgba(0,0,0,.55); success icon `--color-ok-dot` #4CB884; info icon and action `--color-accent` #4DB6AE; error icon `--color-err` #F08A7C; message `--color-ink` #ECE8E1; dismiss icon `--color-mute` #A29C92. No dark-only border (the overlay line is for dialogs only).

## Used by
Publish confirmation, draft save errors, undo after deleting flow steps (canvas), any mutation feedback.

## Differs from current web
The repo Toast keeps its export; restyle to the drawn surface, move the viewport to bottom-left, apply the 4s / 8s / sticky rule and max 3.
