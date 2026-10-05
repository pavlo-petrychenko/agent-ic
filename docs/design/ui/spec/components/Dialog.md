# Dialog (design: scrim + modal)
Purpose: modal window with title/subtitle header, scrolling body and footer actions (status text left, Cancel/primary right).
Source (states): drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
Scrim (full overlay) > dialog[role=dialog] > header (h2 + subtitle + Close IconButton md 34, icon `x` 14) | body (padding 18/22, scroll) | footer (border-top, left note, right buttons).

## Variants / sizes
Width (all designed): sm 560 confirmations | md 640 forms (the page sample) | lg 720 publish | xl 920 two-pane pickers. Tokens `--size-dialog-width-sm/md/lg/xl`; replaces the repo's 440 (`--size-dialog-width`).
Overlays render in the page root (portal) so the scrim covers the sidebar and rail. Viewport is >= 1024, so no sub-560 case; max-height `calc(100vh - 2 * --space-32)` with the body scrolling (proposal, page sample is fixed 300).

## States (loading, error, destructive drawn on DS-States / DS-Dark-States)
- default: footer Cancel (secondary) + primary.
- loading: the primary shows `spinner` 13 before a progress label ("Pausing…") and keeps its width (`cursor: progress`); Cancel and the close IconButton are disabled (0.45); Escape and scrim click do nothing.
- error: Callout err at the top of the body (bg `--color-err-light`, text `--color-err-ink`, radius `--radius-10`, padding `--space-9` `--space-12`, 12.5 `--leading-relaxed`, `alert` 14 icon with 1px top offset, gap `--space-8`), then a 10px gap (`--space-10`), then the body text; the dialog stays open and the primary label becomes the retry ("Try again").
- destructive: the confirm button is Button danger (outlined `--color-err-line`, text `--color-err`), not primary; title names the object ("Delete Salon assistant?").
- open/close motion: scrim fades, dialog fade plus scale .98 -> 1 over `--duration-slow` (320) `--ease-enter`; close about 80% `--ease-exit`; reduced motion: opacity only, at most 120ms (not on DS-States; kept). Close button: hover `--color-soft`, ring `--shadow-focus-ring`.
DS-States sample measures (width 420): header padding 16 20, body 16 20, footer 12 20, close IconButton ghost sm 28, title 18/600 with letter-spacing -0.01em, body text 13 `--color-ink-secondary`. These differ from the DS-Navigation values in Tokens below (header/body 18 22, footer 14 22, close md 34, no tracking): OPEN, Navigation values kept until confirmed.

## Props
```ts
enum DialogSize { Sm = 'sm', Md = 'md', Lg = 'lg', Xl = 'xl' }
interface DialogProps { open: boolean; onOpenChange: (open: boolean) => void; busy: boolean; error: string | null; title: string; description: string | null; closeLabel: string; size: DialogSize; footerLeft: ReactNode | null; footerRight: ReactNode | null; children: ReactNode | null }
```

## Tokens
scrim `--overlay-backdrop` (light rgba(31,29,26,.38), dark rgba(0,0,0,.6)), z `--z-scrim` (400); dialog bg `--color-panel`, radius `--radius-16`, shadow `--shadow-dialog` (dark 0 24px 64px .65), border `--border-width` `--color-overlay-line` (transparent in light, #3A3631 in dark), z `--z-dialog` (410); header padding `--space-18` `--space-22`, border-bottom `--color-line`; title `--type-h2`; subtitle `--type-caption` `--color-mute`; body padding `--space-18` `--space-22`; footer padding `--space-14` `--space-22`, border-top `--color-line`, buttons gap `--space-8` md 34; inline notice: Callout ok (bg `--color-ok-light`, `--color-ok`, radius `--radius-10`, padding `--space-9` `--space-12`, `--type-body-small`, icon `check`).

## Accessibility
Radix Dialog (existing): focus trap, Escape, aria-labelledby/describedby, focus restore, scroll lock. Close button has aria-label. Tooltips (z 600) and toasts (500) stay above or below correctly: a Menu opened inside a Dialog must portal above `--z-dialog`.

## Light/dark
Token-driven; the dark dialog adds the 1px overlay line and the heavier scrim and shadow. Confirmed on DS-Dark-Navigation: border #3A3631, shadow 0 24px 64px rgba(0,0,0,.65), scrim rgba(0,0,0,.6).

## Used by
DS-Navigation (Dialog). Add-source dialog; confirm, edit and publish dialogs.

## Differs from current web
Existing Dialog: width 440, bg `--color-card`, padding 20, text close glyph, no divided header/footer, no sizes, footer right-aligned only. Design: divided sections, panel bg, icon close 34, left footer slot, four widths (sm 560 / md 640 / lg 720 / xl 920; 440 is dropped), dark 1px `--color-overlay-line` border, scrim and shadow tokens per theme, z scale 400/410.
