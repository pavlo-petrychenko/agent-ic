# Callout
Purpose: inline message block with icon, text and optional action inside page content, dialogs and flow nodes.
Merged from: DS-Display (full matrix), DS-Foundations (dark panel) and DS-Flow-Chat (NodeCallout; deleted as a duplicate: same component inside a node).

## Anatomy
root (flex, gap `--space-8`, padding `--space-9` `--space-12`, radius `--radius-10`) > icon (14px, margin-top 1px, aria-hidden) + message (`strong` for the lead phrase) + optional action (margin-left auto, shrink 0).

## Variants (tone)
- neutral: bg `--color-soft`, text `--color-ink-secondary`, info icon
- info: bg `--color-accent-light`, text `--color-accent-dark`
- warn: bg `--color-warn-light`, text `--color-warn-ink` (`--color-warn-ink`, not `--color-warn`)
- err: bg `--color-err-light`, text `--color-err-ink`
- ok: bg `--color-ok-light`, text `--color-ok`
Action slot: secondary `Button` sm (`--size-control-sm`, 28), a standalone link (600, accent colour, underline on hover only), or a ghost `Button`. As drawn: warn has Button sm "Publish anyway", err a link in `--color-err-ink` "View run trace", ok a text button (accent 12.5/600, height 22) "Switch account". Icons: neutral/info `info`, warn `alert`, err `esc`, ok `check`. A link inside the message sentence is always underlined.
DS-Patterns > Table (error) draws err with a secondary Button sm "Retry" (leading `refresh` 13) and the `alert` icon, not `esc`; Toast and EmptyState error also use `alert`. OPEN: proposal `alert` for err everywhere (DS-Display draws `esc`).
Typography `--type-body-small` with `line-height: var(--leading-relaxed)` (1.45). Alignment: flex-start for multi-line without action; centre when an action is present.

## States
Static; the action carries Button/Link states (focus ring outside, disabled 45%). Not dismissible in design: UNDESIGNED, proposal: no close button; callouts are removed by their condition.

## Props
```ts
enum CalloutTone { Neutral = 'neutral', Info = 'info', Warn = 'warn', Err = 'err', Ok = 'ok' }
type CalloutProps = { tone: CalloutTone; icon: IconName | null; action: ReactNode | null; children: ReactNode }
```

## Accessibility
`role="status"` for neutral/info/ok, `role="alert"` for warn/err only when injected after load; inside a node use `role="note"`. Icon aria-hidden. No Radix.

## Light/dark
Dark pairs designed on DS-Foundations: info #16302E/#86D4CC, warn #2E2615/#E8C987 (`--color-warn-ink`), err #351D19/#F5B3A9 (`--color-err-ink`). Dark ok #16291F/#6FCB9C and neutral #2A2824/#CFCAC1 are from the token table (not drawn as callouts).

## Used by
DS-Display (all tones with actions), Foundations dark panel, inbox, settings, publish dialogs, FlowNode (WhatsApp 24 h window note).

## Differs from existing
No Callout in `shared/ui`; `Toast` is floating and stays separate. Neutral and ok tones are new relative to the Foundations page.
