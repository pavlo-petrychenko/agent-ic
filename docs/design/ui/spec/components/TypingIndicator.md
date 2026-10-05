# TypingIndicator
Purpose: shows that a run is producing messages for this chat. New: drawn on DS-Patterns > Chat > Chat extras (light) and DS-Dark-Patterns (dark).

## Anatomy
bubble (align-self end, flex, gap `--space-4`, padding `--space-12` `--space-14`, radius 14 14 4 14 (`--radius-14` with a `--radius-4` tail bottom-right), bg `--color-violet-light`) > three dots 6x6 (`--size-dot-sm`, round, `--color-violet`) at opacity 1, .65, .35 as drawn; then, below the bubble (align end), a caption "Salon assistant is typing…" (`--type-small` 11.5, `--color-mute`).

## Behaviour (drawn rule)
Shows while a run is producing messages for this chat, for at most 30s, then hides (`TYPING_MAX_MS = 30000`). Dots pulse in sequence over 1.2s (`TYPING_PULSE_MS = 1200`, matches the `--duration-pulse` proposal in tokens.md). Reduced motion: no pulse, dots static at the drawn opacities.

## Props
```ts
type TypingIndicatorProps = { label: string }
```

## Tokens
`--color-violet-light`, `--color-violet`, `--color-mute`, `--radius-14`, `--radius-4`, `--size-dot-sm`, `--space-4`, `--space-12`, `--space-14`, `--type-small`.

## Accessibility
`role="status"` with the caption as its text; dots `aria-hidden`.

## Light/dark
DS-Dark-Patterns: bubble #2A2340, dots #B9A6F0, caption #A29C92.

## Used by
Inbox thread and simulator (agent replies). Operator-side; the customer widget does not show it on this board.

## Differs from current web
New. Scope: **DOMAIN: chat**.
