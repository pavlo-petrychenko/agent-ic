# StatusBar
Purpose: 44px bottom bar of a pane/editor showing status text on the left and a link-action on the right.

## Anatomy
div > left [status dot 8 + label 600 + detail 12 mute] | right text-button.

## Variants
Dot tone: ok | warn | err | neutral.

## States
Static. The action is a standalone link: no underline at rest, underline on hover, focus-visible outside ring; disabled: global rule.

## Props
```ts
enum StatusTone { Ok = 'ok', Warn = 'warn', Err = 'err', Neutral = 'neutral' }
interface StatusBarProps { tone: StatusTone; label: string; detail: string | null; action: { label: string; onClick: () => void } | null }
```

## Tokens
height 44 (`--size-statusbar-height`); padding 0 `--space-16`; bg `--color-panel`; border-top `--color-line`; z `--z-raised` (10); dot 8 (`--size-dot-md`) `--radius-pill` colour `--color-ok-dot` (#2F8A5B, brighter than text on purpose: dots need 3:1, text 4.5:1; warn uses `--color-warn-dot`); label `--type-body` weight 600; detail `--type-caption` `--color-mute`; action 12.5/600 `--color-accent` height 22 (`--size-control-xs`).

## Accessibility
role="status" (polite) when the text updates live; the action is a button.

## Light/dark
Dot tokens have dark values (bright enough on dark panel).

## Used by
DS-Navigation (Pane bars). Flow builder (last test run).

## Differs from current web
New.
