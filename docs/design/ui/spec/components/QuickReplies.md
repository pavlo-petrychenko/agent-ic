# QuickReplies
Purpose: row of suggested reply pills under a message.
Anatomy: flex row gap 6; pill pad 5x11, radius pill, 12px.
Variants/states: default (card bg, `--color-line` border, `--color-ink-secondary`); chosen (`--color-accent-light` bg, `--color-accent` border, `--color-accent-dark` text). focus-visible: outside ring with 2px gap (`--shadow-focus-ring`). disabled: normal colours at 45% opacity, no hover/focus, not-allowed (decided: after a reply is chosen the other pills are disabled). hover (decided): bg `--color-soft` on unchosen pills. Pill height: min-height `--size-control-sm` 28 (decided; the page pads 5x11, about 28).
Props: `{ options: string[]; chosen: string | null; onChoose }`.
Tokens: `--radius-pill`, `--type-caption`, `--space-6`; padding --space-5 --space-11.
A11y: role=group of buttons (aria-pressed on chosen); Radix ToggleGroup could fit.
Light/dark: pairs have dark values (card, line, accent-light, accent-dark). Inside the customer widget the chosen pill uses the widget accent (decided), with #FFFFFF text on a customer accent.
Used: DS-Flow-Chat.
