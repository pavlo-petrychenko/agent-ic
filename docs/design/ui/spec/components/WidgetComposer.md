# WidgetComposer
Purpose: message input row of the customer web widget. Drawn on DS-Patterns > Chat > Chat extras as "web widget composer (vision, not in MVP)" (light) and DS-Dark-Patterns (dark). Build only when the web widget is in scope.

## Anatomy
row (flex, align centre, gap `--space-6`, padding `--space-10`, border-top `--border-width` `--color-line`) > attach IconButton ghost sm 28 (`upload` 14, `--color-mute`, aria-label "Attach") + input (flex-grow, min-width 0, height 34, no border, transparent, 13px `--color-ink`, placeholder "Write a message…", aria-label "Message") + send IconButton sm 28 (bg widget accent, icon `send` 14, radius `--radius-8`, aria-label "Send").
Context drawn with it: widget panel 300 wide, radius 16, `--shadow-popover`, no border; header (padding 12px 14px, bg widget accent, avatar 32 round with initials 12/600, name 600 + "Usually replies in a minute" 11.5 at opacity .85); body bg `--color-bg`, padding 14, gap 8, bot bubble max-width 220 (see WidgetPreview).

## States
Not drawn, decided as proposed: focus = no field ring inside the row, the row's top border turns `--color-accent`; send disabled by the global rule while empty; sending = `spinner` in the send button. Attachments: out of scope (decided).

## Props
```ts
type WidgetComposerProps = { value: string; onChange: (value: string) => void; onSend: () => void; attach: { label: string; onAttach: () => void } | null; placeholder: string; messageLabel: string; sendLabel: string; accent: string; sending?: boolean; disabled?: boolean }
```
`attach` (decided) groups the attach handler with its label so a missing handler never leaves an orphan label. The field is a borderless `textarea` that grows up to 4 lines; Enter sends, Shift+Enter adds a line. While sending the field is read-only and the send button shows `spinner`; disabled dims the field and both buttons (45%) and the row keeps its border.

## Tokens
`--color-line`, `--color-mute`, `--color-ink`, `--radius-8`, `--space-6`, `--space-10`; accent from `--widget-accent` (customer value), not `--color-accent`.

## Accessibility
Labelled input, Enter sends, Shift+Enter adds a line (decided); buttons have aria-labels.

## Light/dark
DS-Dark-Patterns draws the panel in dashboard dark (card #211F1C, body #151412, border #34312C) and the send icon in `--color-on-accent` #0B1F1D on #4DB6AE. Decided: the widget dark theme follows the dashboard tokens; the send icon is #FFFFFF on a customer accent and `--color-on-accent` only on the product accent.

## Used by
Web widget (post-MVP vision), WidgetPreview input row.

## Differs from current web
New. Scope: **DOMAIN: chat**; not in MVP.
