# ChatSystemMessage
Purpose: operator-visible event line in a conversation thread: hand-off (took over, handed back), chat closed, delivery failure. New: drawn on DS-Patterns > Chat > Chat extras (light) and DS-Dark-Patterns (dark).

## Anatomy
div (align-self centre, inline-flex, align centre, gap `--space-6`, padding `--space-4` `--space-10`, radius `--radius-pill`, bg `--color-soft`) > icon 12 (stroke 1.5) + text (`--type-small` 11.5) "<event> · <time>".

## Variants (tone)
- neutral: text and icon `--color-mute`. Drawn: hand-off "Pavlo took over · 14:05" (`hand`), closing "Chat closed by Pavlo · 14:12" (`check`).
- error: text and icon `--color-err` on the same `--color-soft` pill (no err fill). Drawn: "Message not delivered — bot blocked by the user" (`alert`), for delivery failures.

## States
Static, not interactive.

## Props
```ts
enum ChatSystemMessageTone { Neutral = 'neutral', Err = 'err' }
type ChatSystemMessageProps = { tone: ChatSystemMessageTone; icon: IconName; text: string }
```

## Tokens
`--color-soft`, `--color-mute`, `--color-err`, `--radius-pill`, `--space-4`, `--space-6`, `--space-10`, `--type-small`.

## Accessibility
A list item in the thread's `role="log"`; the error tone is announced politely (not `alert`, the log already announces). Operator-visible only: customers never see these (drawn rule), so the widget never renders it.

## Light/dark
DS-Dark-Patterns: pill #2A2824, neutral text #A29C92, error text #F08A7C.

## Used by
Inbox thread, simulator thread. Decided: hand-off, close and delivery failure are always this pill; ChatDivider stays for a paused flow and day changes.

## Differs from current web
New. Scope: **DOMAIN: chat**.
