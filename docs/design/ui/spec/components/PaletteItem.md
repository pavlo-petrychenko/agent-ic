# PaletteItem
Purpose: compact insertable-item row for the flow-builder palette (tile + label).

## Anatomy
Button: NodeTile 22px | label.

## Variants
Tile hue per node kind: ok (Send message: --color-ok-light/--color-ok), api (--hue-api-bg/fg), trig (Tool event, icon `tool-event` (renamed from toolev): --hue-trig-bg/fg = --color-dark/--color-on-dark).

## Sizes
Height 30px (`--size-row-sm`, decided; a list-row height, not a control size), padding 0 6px, gap --space-10, radius --radius-6, tile 22px (--size-tile-sm) radius --radius-6, icon ~12px.

## States
default transparent. focus-visible: inset 2px accent ring (`--shadow-focus-ring-inset`) since the row sits in a clipped list. disabled: normal colours at 45% opacity, no hover/focus, not-allowed. dragging (drawn on DS-Patterns > Canvas interactions "drag from palette"): the source row gets bg `--color-chip` while the drag lasts; the pointer carries a ghost FlowNode of that kind at 70% opacity with `--shadow-popover`, rotated -1.5deg; a drop on an edge shows a 2px `--color-accent` insertion line; Esc cancels. Hover (decided): bg `--color-soft`, cursor grab. Keyboard alternative (decided): Enter/Space inserts after the selected node. The same rows fill the canvas "Add step" Menu (see FlowCanvas).

## Props
```ts
type PaletteItemProps = { label: string; icon: ReactNode; tone: 'ok'|'info'|'dark'; onSelect: () => void; disabled: boolean };
```

## Tokens
--type-body color --color-ink; text-align left; inherits font.

## Accessibility
`<button type="button">`; keyboard Enter/Space inserts; if drag-and-drop, keyboard alternative required.

## Light/dark
Hue pairs have dark values (tokens.md); the trig tile follows --color-dark.

## Used by
DS-Data (Navigation lists, "Actions"). Belongs to Flow/Chat category (DS-Flow-Chat likely duplicates): noted as first-seen on this page.
