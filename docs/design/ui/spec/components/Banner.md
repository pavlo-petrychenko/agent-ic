# Banner
Purpose: full-width strip under a pane header for the state of the whole pane.

## Anatomy
root (flex, gap 8, center, padding 10px 18px) > icon 14px + text. No radius, no border, no action slot drawn.

## Variants (tone)
info (bg `--color-accent-light`, text `--color-accent-dark`; icon hand), warn (`--color-warn-light` / `--color-warn-ink`; icon alert), err (`--color-err-light` / `--color-err-ink`; icon alert). Typography `--type-body-small`. Padding `--space-10` / `--space-18`.

## States
Static. Not dismissible. Links inside the text are in-sentence links: always underlined.
UNDESIGNED: action slot and dismiss. Proposal: reuse the Callout action slot (Button sm 28 or standalone link) right-aligned.

## Props
```ts
enum BannerTone { Info = 'info', Warn = 'warn', Err = 'err' }
type BannerProps = { tone: BannerTone; icon: IconName | null; children: ReactNode }
```

## Accessibility
`role="status"` for info/warn, `role="alert"` for err (only when injected after load). Icon aria-hidden. No Radix.

## Light/dark
Token-driven, same pairs as Callout.

## Used by
Chat pane (operator takeover), agent editor (unpublished changes), channels (disconnected).

## Differs from Callout
Edge-to-edge, no radius, no action slot drawn.
