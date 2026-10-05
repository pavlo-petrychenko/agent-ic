# EdgeLabel
Purpose: condition tag on an edge ("else", "needs_human == true").
Anatomy: absolute chip, pad 2x7, radius 6, mono 11px, nowrap.
Variants: default (card bg, `--color-line-node` border, `--color-ink-secondary` text); active (`--color-accent-light` bg, `--color-accent` border, `--color-accent-dark` text).
Props: `{ text: string; active: boolean }`.
Tokens: `--radius-6`, `--font-mono`; `--type-mono-xs`; padding --space-2 --space-7.
A11y: text; if editable then button.
States: default, active (designed). Editable (drawn rule, DS-Patterns): clicking a router edge's label edits the rule in the inspector, so the label is a button; DS-Patterns draws router labels in the default style under each out-port ("needs_human", "else"). hover (decided): border `--color-edge`; focus-visible: outside ring 2px gap (`--shadow-focus-ring`). Light/dark: pairs have dark values.
Used: DS-Flow-Chat.
