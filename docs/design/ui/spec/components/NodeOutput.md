# NodeOutput
Purpose: mono chip showing what a node outputs (page: node_out; node_meta is a plain caption line).
Anatomy: inline block, mono 11px, pad 3x6, radius 5, prefix arrow "→". NodeMeta: 12px caption in `--color-mute` ("Fast model · records score only").
Tokens: bg `--color-soft`; text `--color-ink-secondary`; font `--type-mono-xs`; NodeMeta `--type-caption`, `--color-mute`. Radius `--radius-5`.
Props: `{ text: string }` / `{ text: string }`.
A11y: plain text.
Light/dark: --color-soft and --color-ink-secondary have dark values.
Used: DS-Flow-Chat.
