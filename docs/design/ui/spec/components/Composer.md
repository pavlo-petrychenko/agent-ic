# Composer
Purpose: chat reply bar: large text input plus primary icon send button.
Source: DS-Inputs v2 (Composer). States: drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
row, gap `--space-8`, align centre: input (lg, grows, min-width 0) + send IconButton (primary, lg, 40x40, `send` icon 16px, `aria-label`).

## Tokens
Input lg: height 40, radius `--radius-10`, padding-x `--space-12`, 13px. Placeholder "Write a message…". Hidden label "Reply".

## States (drawn on DS-States / DS-Dark-States)
- empty: input default (1px `--color-line`), send button disabled (0.45, not-allowed, no hover/focus): "Send is disabled while the field is empty".
- focus: input border `--color-accent` + `--shadow-focus-field`; send enabled (primary, hover `--color-accent-dark`).
- sending: input keeps the text and returns to the `--color-line` border; send button shows `spinner` 16 in place of `send`, full colour (not dimmed).
- failed: input cleared to the placeholder; a line below (margin-top `--space-6`, gap `--space-8`): `alert` 12 + message 11.5 `--color-err` ("Not delivered — Telegram is unreachable") + "Retry" TextLink error tone (12/600 `--color-err-ink`, no underline).
- disabled: the whole row (input + send) at 0.45, not-allowed; a reason line below at full opacity, 11.5 `--color-mute` ("Take over the chat to reply").
Keys (page): Enter sends, Shift+Enter adds a line; the field grows to 6 lines, then scrolls (multi-line growth resolved; the drawn field is single-line 40). Attachments: out of scope (decided).

## Props
```ts
interface ComposerProps { value: string; onChange: (v: string) => void; onSend: () => void; onRetry: (() => void) | null; placeholder: string; label: string; sendLabel: string; sending: boolean; error: string | null; retryLabel: string; disabled: boolean; disabledReason: string | null }
```

## Accessibility
Enter submits; button `aria-label` from `sendLabel`. No Radix.

## Light/dark
Token-driven.

## Used by
Simulator, Inbox reply, widget test chat.
