# CompactNode
Purpose: minimal pill node for structural steps (Parallel).
Anatomy: pill 120x36, icon tile 22px + label 600. Pad 0 12, gap 8.
Variants: pill (radius 999, "Parallel"), rounded-rect (200x48 radius 12 "Needs a person?", "Booking found?", used as decision nodes). Selected: 2px accent border + 4px halo (`--shadow-selected`, pad 11 to avoid shift; designed). focus-visible: outside ring 2px gap (`--shadow-focus-ring`). disabled: 45%.
States: default, selected (designed); hover (decided): border `--color-edge`; invalid (decided, as FlowNode): border `--color-err` and an `alert` icon after the label, its title the reason.
Props: `{ label: string; kind: NodeKind; shape: 'pill' | 'card'; selected: boolean; invalidLabel: string | null }`.
Tokens: bg `--color-card`; border `--color-line-node`; radius `--radius-pill` / `--radius-12`; tile radius `--radius-6`; label `--type-title`; selected `--color-accent` + `--shadow-selected`. No `--shadow-node` on compact.
Tile tints: Parallel uses hue par; decision uses hue router (--hue-par-bg/fg, --hue-router-bg/fg).
A11y: same as FlowNode.
Light/dark: hue pairs have dark values (tokens.md).
Used: DS-Flow-Chat.
